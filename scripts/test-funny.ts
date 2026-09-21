import { generateFunnyImage } from "../src/lib/fal";

async function main() {
  const selfieUrl =
    "https://res.cloudinary.com/tdihs0by/image/upload/v1/tiktok-creator/selfies/acta6eln1doaukyth0bw.jpg";
  const publicId = "tiktok-creator/selfies/acta6eln1doaukyth0bw";
  const t0 = Date.now();
  const result = await generateFunnyImage({
    selfieUrl,
    publicId,
    style: "caricature",
  });
  console.log(JSON.stringify({ ok: true, ...result, ms: Date.now() - t0 }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
