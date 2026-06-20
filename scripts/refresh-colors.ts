/**
 * Re-extract plumage colors from cached photo cutouts (no network).
 * Run: npm run refresh-colors
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildThemeFromPlumage,
  colorFamiliesFrom,
  passesWcagAA,
} from "../src/lib/color/plumage";
import { hasBirdImage } from "../src/lib/photos/placeholder";
import { writePublicBirdData } from "./lib/write-public-data";
import { extractColorsFromPhoto, hasCachedCutout } from "./lib/photo-cutout";
import { resolveImageUrl } from "./lib/image-overrides";
import { withSimilarity } from "./lib/similarity-build";
import type { BirdRecord } from "./bird-record";

const DATASET = path.join(process.cwd(), "prisma", "seed", "dataset.json");
const SOURCE = "photo-extraction";

async function main() {
  const { birds } = JSON.parse(await readFile(DATASET, "utf-8")) as {
    birds: BirdRecord[];
  };

  console.log(`\nRefreshing photo colors for ${birds.length} birds…\n`);

  let updated = 0;
  let missing = 0;
  let done = 0;
  let cursor = 0;
  const CONCURRENCY = 8;

  async function worker() {
    while (cursor < birds.length) {
      const i = cursor++;
      const b = birds[i];
      const imageUrl = resolveImageUrl(b.slug, b.imageUrl);

      if (!hasBirdImage(imageUrl)) {
        missing++;
        done++;
        continue;
      }

      const cached = await hasCachedCutout(b.slug, imageUrl);
      if (!cached) {
        missing++;
        done++;
        continue;
      }

      try {
        const colors = await extractColorsFromPhoto(b.slug, imageUrl, {
          quiet: true,
        });
        if (colors.length === 0) {
          missing++;
        } else {
          const theme = buildThemeFromPlumage(colors);
          b.imageUrl = imageUrl;
          b.colors = colors;
          b.colorFamilies = colorFamiliesFrom(colors);
          b.theme = theme;
          b.wcagAA = passesWcagAA(theme);
          b.updatedAt = new Date().toISOString();
          updated++;
        }
      } catch {
        missing++;
      }

      done++;
      if (done % 200 === 0 || done === birds.length) {
        process.stdout.write(`\r  ${done}/${birds.length}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );
  process.stdout.write("\n");

  const withSim = withSimilarity(birds);

  await writeFile(
    DATASET,
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
  await writePublicBirdData(withSim);

  console.log(
    `\n✓ Updated colors for ${updated} birds (${missing} missing cutout or failed)\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
