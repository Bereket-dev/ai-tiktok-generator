/**
 * MIME type detection and MediaRecorder helpers for browser recording.
 * Supports WebM/VP9, WebM/VP8, MP4/H.264 fallback chain.
 */

export const MIME_PRIORITY = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4;codecs=h264,aac",
  "video/mp4",
] as const;

export type SupportedMime = (typeof MIME_PRIORITY)[number] | string;

/**
 * Returns the first MIME type supported by MediaRecorder in this browser.
 * Falls back to empty string (browser default) if none match.
 */
export function getSupportedMime(): SupportedMime {
  if (typeof window === "undefined" || !window.MediaRecorder) return "";
  for (const mime of MIME_PRIORITY) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

/**
 * Returns the file extension appropriate for a MIME type.
 */
export function mimeToExtension(mime: string): string {
  if (mime.startsWith("video/mp4")) return "mp4";
  if (mime.startsWith("video/webm")) return "webm";
  return "webm";
}

/**
 * Estimate a reasonable bitrate based on navigator.connection.
 * Falls back to 1.5 Mbps if Connection API unavailable.
 */
export function getRecommendedBitrate(): number {
  if (typeof navigator === "undefined") return 1_500_000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  if (!conn) return 1_500_000;
  const effectiveType: string = conn.effectiveType ?? "4g";
  switch (effectiveType) {
    case "slow-2g":
    case "2g":
      return 250_000;   // 250 kbps
    case "3g":
      return 750_000;   // 750 kbps
    case "4g":
    default:
      return 1_500_000; // 1.5 Mbps
  }
}

/**
 * Build MediaRecorder options with best available MIME + bitrate.
 */
export function buildRecorderOptions(): MediaRecorderOptions {
  const mimeType = getSupportedMime();
  const videoBitsPerSecond = getRecommendedBitrate();
  const opts: MediaRecorderOptions = { videoBitsPerSecond };
  if (mimeType) opts.mimeType = mimeType;
  return opts;
}

/**
 * Format seconds as MM:SS.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
