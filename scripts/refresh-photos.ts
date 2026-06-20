/**
 * Re-resolve bird photos (BirdNET → iNaturalist fallback) without re-extracting colors.
 * Run: npm run refresh-photos
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPhotoResolver } from "./lib/photos";
import { writePublicBirdData } from "./lib/write-public-data";
import { resolveImageUrl } from "./lib/image-overrides";
import type { BirdRecord } from "./bird-record";

const DATASET = path.join(process.cwd(), "prisma", "seed", "dataset.json");
const SOURCE = "photo-extraction";

async function main() {
  const { birds } = JSON.parse(await readFile(DATASET, "utf-8")) as {
    birds: BirdRecord[];
  };

  console.log(`\nRefreshing photos for ${birds.length} birds…\n`);

  const photos = await createPhotoResolver({
    fetchPhotos: true,
    refreshCache: process.argv.includes("--refresh-cache"),
    delayMs: 0,
  });

  let birdnet = 0;
  let inat = 0;
  let local = 0;
  let placeholder = 0;
  let done = 0;

  const CONCURRENCY = 16;
  let cursor = 0;

  async function worker() {
    while (cursor < birds.length) {
      const i = cursor++;
      const b = birds[i];
      const url = resolveImageUrl(
        b.slug,
        await photos.get(b.scientificName, b.name),
      );
      b.imageUrl = url;

      if (url.includes("birdnet.cornell.edu")) birdnet++;
      else if (url.includes("inaturalist")) inat++;
      else if (url.startsWith("/birds/")) local++;
      else placeholder++;

      done++;
      if (done % 500 === 0 || done === birds.length) {
        process.stdout.write(`\r  ${done}/${birds.length}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );

  await photos.flush();

  await writeFile(
    DATASET,
    JSON.stringify(
      {
        version: 2,
        source: SOURCE,
        generatedAt: new Date().toISOString(),
        birds,
      },
      null,
      2,
    ),
  );
  await writePublicBirdData(birds);

  process.stdout.write("\n");
  console.log(
    `\n✓ Photos updated\n` +
      `  BirdNET: ${birdnet}  iNaturalist: ${inat}  local: ${local}  placeholder: ${placeholder}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
