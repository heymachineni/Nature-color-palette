/**
 * Re-resolve bird photos (BirdNET → iNaturalist fallback) without rebuilding colors.
 * Run: npm run refresh-photos:hbw
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPhotoResolver } from "./hbw/photos";
import { previewHexes } from "../src/lib/color/plumage";
import type { BirdRecord } from "./bird-record";

const DATASET = path.join(process.cwd(), "prisma", "seed", "dataset.json");
const INDEX = path.join(process.cwd(), "public", "data", "index.json");

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
      const url = await photos.get(b.scientificName, b.name);
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

  const index = birds.map((b) => ({
    slug: b.slug,
    name: b.name,
    scientificName: b.scientificName,
    region: b.region,
    imageUrl: b.imageUrl,
    colorFamilies: b.colorFamilies,
    preview: previewHexes(b.colors),
    palette: b.colors.map((c) => ({ hex: c.hex, share: c.share })),
  }));

  await writeFile(
    DATASET,
    JSON.stringify(
      {
        version: 2,
        source: "hbw-dryad",
        generatedAt: new Date().toISOString(),
        birds,
      },
      null,
      2,
    ),
  );
  await writeFile(INDEX, JSON.stringify(index));

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
