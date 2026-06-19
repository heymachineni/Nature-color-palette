/**
 * Remove birds without a real photo from dataset + search index.
 * Run: tsx scripts/remove-no-photo-birds.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { previewHexes } from "../src/lib/color/plumage";
import { filterBirdsWithPhotos } from "../src/lib/photos/placeholder";
import type { BirdRecord } from "./bird-record";

const DATASET = path.join(process.cwd(), "prisma", "seed", "dataset.json");
const INDEX = path.join(process.cwd(), "public", "data", "index.json");

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
        source: "hbw-dryad",
        generatedAt: new Date().toISOString(),
        birds: kept,
      },
      null,
      2,
    ),
  );

  await writeFile(
    INDEX,
    JSON.stringify(
      kept.map((b) => ({
        slug: b.slug,
        name: b.name,
        scientificName: b.scientificName,
        region: b.region,
        imageUrl: b.imageUrl,
        colorFamilies: b.colorFamilies,
        preview: previewHexes(b.colors),
        palette: b.colors.map((c) => ({ hex: c.hex, share: c.share })),
        colors: b.colors,
        similar: (b.similar ?? []).map((s) => s.slug),
      })),
    ),
  );

  console.log(`\n✓ Removed ${removed} birds without photos. ${kept.length} remain.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
