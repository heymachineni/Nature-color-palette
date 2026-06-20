/**
 * Build dataset.json from bird photos — colors extracted via bg removal + pixel scan.
 *
 * Usage:
 *   npm run build:birds                  # all birds in dataset.json
 *   npm run build:birds -- --limit 50    # smoke test
 *   npm run build:birds -- --refresh-photos
 *   npm run build:birds -- --from-taxonomy  # species list from BirdNET CSV
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  buildThemeFromPlumage,
  colorFamiliesFrom,
  passesWcagAA,
} from "../src/lib/color/plumage";
import { hasBirdImage, filterBirdsWithPhotos } from "../src/lib/photos/placeholder";
import { writePublicBirdData } from "./lib/write-public-data";
import { createPhotoResolver } from "./lib/photos";
import { extractColorsFromPhoto } from "./lib/photo-cutout";
import { resolveImageUrl } from "./lib/image-overrides";
import { loadSpecies } from "./lib/species";
import { withSimilarity } from "./lib/similarity-build";
import type { BirdRecord } from "./bird-record";

const OUTPUT = path.join(process.cwd(), "prisma", "seed", "dataset.json");
const SOURCE = "photo-extraction";

function parseArgs(argv: string[]) {
  const limitIdx = argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 ? Number(argv[limitIdx + 1]) : Number(process.env.BUILD_LIMIT ?? 0);
  const concurrencyIdx = argv.indexOf("--concurrency");
  const concurrency = concurrencyIdx >= 0 ? Number(argv[concurrencyIdx + 1]) : 4;
  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 0,
    concurrency: Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 4,
    noPhotos: argv.includes("--no-photos"),
    refreshPhotos: argv.includes("--refresh-photos"),
    fromTaxonomy: argv.includes("--from-taxonomy"),
    quiet: argv.includes("--quiet"),
  };
}

async function main() {
  const { limit, concurrency, noPhotos, refreshPhotos, fromTaxonomy, quiet } =
    parseArgs(process.argv.slice(2));

  const species = await loadSpecies({ fromTaxonomy, limit });
  console.log(
    `\nPhoto build — ${species.length} species` +
      (fromTaxonomy ? " (BirdNET taxonomy)" : " (from dataset.json)") +
      `\n  concurrency: ${concurrency}\n`,
  );

  const photos = await createPhotoResolver({
    fetchPhotos: !noPhotos,
    refreshCache: refreshPhotos,
    delayMs: 200,
  });

  const birds: BirdRecord[] = [];
  let skipped = 0;
  let done = 0;
  let cursor = 0;

  async function processOne(entry: (typeof species)[0]): Promise<void> {
    let imageUrl = entry.imageUrl ?? "";
    if (!noPhotos && (refreshPhotos || !hasBirdImage(imageUrl))) {
      imageUrl = await photos.get(entry.scientificName, entry.name);
    }
    imageUrl = resolveImageUrl(entry.slug, imageUrl);

    if (!hasBirdImage(imageUrl)) {
      skipped++;
      return;
    }

    try {
      const colors = await extractColorsFromPhoto(entry.slug, imageUrl, {
        quiet,
      });
      if (colors.length === 0) {
        skipped++;
        return;
      }

      const theme = buildThemeFromPlumage(colors);
      birds.push({
        slug: entry.slug,
        name: entry.name,
        scientificName: entry.scientificName,
        region: entry.region,
        imageUrl,
        colors,
        colorFamilies: colorFamiliesFrom(colors),
        theme,
        wcagAA: passesWcagAA(theme),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      if (!quiet) {
        console.log(`  ✗ ${entry.slug}: ${(err as Error).message}`);
      }
      skipped++;
    }
  }

  async function worker() {
    while (cursor < species.length) {
      const i = cursor++;
      await processOne(species[i]);
      done++;
      if (!quiet && (done % 25 === 0 || done === species.length)) {
        process.stdout.write(
          `\r  Extracted ${birds.length} ok, ${skipped} skipped — ${done}/${species.length}`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, species.length) }, () =>
      worker(),
    ),
  );

  process.stdout.write("\n");
  await photos.flush();

  const withPhotos = filterBirdsWithPhotos(birds);
  if (withPhotos.length < birds.length) {
    skipped += birds.length - withPhotos.length;
  }

  const withSim = withSimilarity(withPhotos);
  await mkdir(path.dirname(OUTPUT), { recursive: true });

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        version: 2,
        source: SOURCE,
        generatedAt: new Date().toISOString(),
        birds: withSim,
      },
      null,
      2,
    ),
  );
  const { total, pageCount } = await writePublicBirdData(withSim);

  console.log(
    `\n✓ Wrote ${total} birds (${skipped} skipped)\n` +
      `  ${path.relative(process.cwd(), OUTPUT)}\n` +
      `  public/data/manifest.json (${pageCount} pages)\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
