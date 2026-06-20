/**
 * Remove birds without a real photo from dataset + search index.
 * Run: tsx scripts/remove-no-photo-birds.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { filterBirdsWithPhotos } from "../src/lib/photos/placeholder";
import { writePublicBirdData } from "./lib/write-public-data";
import type { BirdRecord } from "./bird-record";

const DATASET = path.join(process.cwd(), "prisma", "seed", "dataset.json");

async function main() {
  const { birds } = JSON.parse(await readFile(DATASET, "utf-8")) as {
    birds: BirdRecord[];
  };
  const kept = filterBirdsWithPhotos(birds);
  const removed = birds.length - kept.length;

  await writeFile(
    DATASET,
    JSON.stringify(
      {
        version: 2,
        source: "photo-extraction",
        generatedAt: new Date().toISOString(),
        birds: kept,
      },
      null,
      2,
    ),
  );

  await writePublicBirdData(kept);

  console.log(`\n✓ Removed ${removed} birds without photos. ${kept.length} remain.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
