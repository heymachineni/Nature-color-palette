/**
 * Retry BirdNET + iNaturalist for birds on the placeholder (or missing) image.
 * Clears imageUrl when no real photo exists. Updates dataset, index, and cache.
 *
 * Run: tsx scripts/fix-placeholders.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { birdNetImageUrl } from "./lib/birdnet";
import { isBirdNetPlaceholder } from "./lib/photos";
import { fetchInaturalistPhoto } from "../src/lib/photos/inaturalist";
import {
  filterBirdsWithPhotos,
  isBirdPlaceholderUrl,
} from "../src/lib/photos/placeholder";
import { writePublicBirdData } from "./lib/write-public-data";
import type { BirdRecord } from "./bird-record";

const DATASET = path.join(process.cwd(), "prisma", "seed", "dataset.json");
const CACHE = path.join(process.cwd(), "data", "photos", "photo-cache.json");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function resolvePhoto(
  scientificName: string,
  commonName: string,
): Promise<string> {
  try {
    const candidate = await birdNetImageUrl(scientificName);
    if (candidate && !(await isBirdNetPlaceholder(candidate))) {
      return candidate;
    }
  } catch {
    /* try iNaturalist */
  }

  try {
    const inat = await fetchInaturalistPhoto(scientificName, commonName);
    if (inat) return inat;
  } catch {
    /* no photo */
  }

  return "";
}

async function main() {
  const { birds } = JSON.parse(await readFile(DATASET, "utf-8")) as {
    birds: BirdRecord[];
  };
  const cache = JSON.parse(await readFile(CACHE, "utf-8")) as Record<
    string,
    string
  >;

  const targets = birds.filter((b) => isBirdPlaceholderUrl(b.imageUrl));
  console.log(
    `\nResolving photos for ${targets.length} birds (BirdNET → iNaturalist)…\n`,
  );

  let fixed = 0;
  let cleared = 0;

  for (let i = 0; i < targets.length; i++) {
    const b = targets[i];
    const key = b.scientificName.toLowerCase();
    delete cache[key];

    const url = await resolvePhoto(b.scientificName, b.name);
    b.imageUrl = url;

    if (url) {
      cache[key] = url;
      fixed++;
      console.log(`  ✓ ${b.name}`);
    } else {
      cleared++;
      console.log(`  — ${b.name} (no photo)`);
    }

    if ((i + 1) % 10 === 0 || i + 1 === targets.length) {
      process.stdout.write(`\r  ${i + 1}/${targets.length}`);
    }
    await sleep(800);
  }

  const withPhotos = filterBirdsWithPhotos(birds);
  const removed = birds.length - withPhotos.length;

  await writeFile(
    DATASET,
    JSON.stringify(
      {
        version: 2,
        source: "photo-extraction",
        generatedAt: new Date().toISOString(),
        birds: withPhotos,
      },
      null,
      2,
    ),
  );
  await writePublicBirdData(withPhotos);
  await writeFile(CACHE, JSON.stringify(cache, null, 2));

  process.stdout.write("\n");
  console.log(
    `\n✓ Resolved ${fixed} photos. Removed ${removed} birds with no photo (${cleared} still missing after retry).\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
