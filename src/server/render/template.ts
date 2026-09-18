import ffmpeg from "fluent-ffmpeg";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

const FONT_PATH_AM = process.env.AMHARIC_FONT_PATH ?? "/usr/share/fonts/noto/NotoSerifEthiopic-Regular.ttf";
const FONT_PATH_EN = process.env.ENGLISH_FONT_PATH ?? "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf";

export interface RenderOptions {
  renderId: string;
  selfieUrl: string;
  hookText: string;
  ctaText: string;
  locale: "am" | "en";
  resolution: "1080x1920" | "720x1280";
}

/**
 * Downloads a file from a URL to a temp path.
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed: ${url} — ${res.status}`);
  const out = createWriteStream(destPath);
  await pipeline(res.body as unknown as NodeJS.ReadableStream, out);
}

/**
 * Runs the fixed 9:16 FFmpeg template.
 * Returns the output file path.
 */
export async function runRenderTemplate(opts: RenderOptions): Promise<string> {
  const { renderId, selfieUrl, hookText, ctaText, locale, resolution } = opts;

  const [width, height] = resolution.split("x").map(Number);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `render-${renderId}-`));
  const inputPath = path.join(tmpDir, "input.webm");
  const outputPath = path.join(tmpDir, "output.mp4");

  try {
    // 1. Download selfie video
    await downloadFile(selfieUrl, inputPath);

    const fontPath = locale === "am" ? FONT_PATH_AM : FONT_PATH_EN;

    // Escape text for ffmpeg drawtext filter
    const escapeText = (t: string) =>
      t.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");

    const hookEscaped = escapeText(hookText);
    const ctaEscaped = escapeText(ctaText);

    // 2. Build FFmpeg filter graph:
    //    - Scale/crop user clip to target 9:16
    //    - Add hook text (top, large)
    //    - Add CTA text (bottom)
    //    - Fade in/out

    const filterComplex = [
      // Scale to fill 9:16 canvas, cropping if needed
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1[scaled]`,
      // Dark overlay at top for hook readability
      `color=black@0.45:s=${width}x${Math.round(height * 0.2)}[topbar]`,
      // Dark overlay at bottom for CTA readability
      `color=black@0.45:s=${width}x${Math.round(height * 0.12)}[botbar]`,
      // Overlay bars
      `[scaled][topbar]overlay=0:0[v1]`,
      `[v1][botbar]overlay=0:${height - Math.round(height * 0.12)}[v2]`,
      // Hook text (top, line-wrapped)
      `[v2]drawtext=fontfile='${fontPath}':text='${hookEscaped}':fontcolor=white:fontsize=${Math.round(width * 0.055)}:x=(w-text_w)/2:y=${Math.round(height * 0.05)}:line_spacing=8:shadowcolor=black:shadowx=2:shadowy=2[v3]`,
      // CTA text (bottom)
      `[v3]drawtext=fontfile='${fontPath}':text='${ctaEscaped}':fontcolor=white:fontsize=${Math.round(width * 0.04)}:x=(w-text_w)/2:y=${height - Math.round(height * 0.08)}:shadowcolor=black:shadowx=1:shadowy=1[v4]`,
      // Fade in/out (0.5s each)
      `[v4]fade=t=in:st=0:d=0.5,fade=t=out:st=14.5:d=0.5[vout]`,
    ].join(";");

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .complexFilter(filterComplex)
        .map("[vout]")
        .audioCodec("aac")
        .audioBitrate("128k")
        .videoCodec("libx264")
        .outputOptions([
          "-preset fast",
          "-crf 23",
          "-pix_fmt yuv420p",
          "-movflags +faststart",
          "-t 30", // max 30s output
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    return outputPath;
  } catch (err) {
    // Cleanup on error
    await fs.rm(tmpDir, { recursive: true, force: true });
    throw err;
  }
}
