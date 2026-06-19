/**
 * Build dataset.json from Dryad HBW color proportions (~10,290 species).
 *
 * Prerequisites:
 *   data/hbw/Data_S1.zip  (download from https://doi.org/10.5061/dryad.70rxwdc6s)
 *
 * Usage:
 *   npm run build:hbw                  # all species, iNaturalist photos
 *   npm run build:hbw -- --limit 50     # smoke test
 *   npm run build:hbw -- --refresh-photos   # re-resolve BirdNET + iNaturalist images
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ensureHbwExtracted } from "./hbw/paths";
import {
  loadHbwColorGroups,
  loadHbwIllustrations,
  pickSpeciesIllustrations,
  dedupeByCommonName,
  slugFromScientificName,
} from "./hbw/parse";
import { createPhotoResolver } from "./hbw/photos";
import { plumageFromHbwProportions } from "../src/lib/color/hbw-plumage";
import {
  buildThemeFromPlumage,
  colorFamiliesFrom,
  passesWcagAA,
  previewHexes,
} from "../src/lib/color/plumage";
import { rankSimilarBirds } from "../src/lib/color/similarity";
import { hasBirdImage } from "../src/lib/photos/placeholder";
import type { BirdRecord } from "./bird-record";

const OUTPUT = path.join(process.cwd(), "prisma", "seed", "dataset.json");
const INDEX_OUTPUT = path.join(process.cwd(), "public", "data", "index.json");

function parseArgs(argv: string[]) {
  const limitIdx = argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 ? Number(argv[limitIdx + 1]) : Number(process.env.HBW_LIMIT ?? 0);
  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 0,
    noPhotos: argv.includes("--no-photos"),
    useFixture: argv.includes("--fixture"),
    refreshPhotos: argv.includes("--refresh-photos"),
  };
}

const MAX_SIMILARITY_CANDIDATES = 250;

function capSimilarityPool<T>(pool: T[], max: number): T[] {
  if (pool.length <= max) return pool;
  const step = pool.length / max;
  const capped: T[] = [];
  for (let k = 0; k < max; k++) {
    capped.push(pool[Math.floor(k * step)]);
  }
  return capped;
}

function withSimilarity(birds: BirdRecord[]): BirdRecord[] {
  const index = birds.map((b) => ({
    id: b.slug,
    palette: b.colors.map((c) => c.hex),
    families: b.colorFamilies,
  }));

  const byFamily = new Map<string, number[]>();
  for (let i = 0; i < index.length; i++) {
    for (const f of index[i].families) {
      const list = byFamily.get(f) ?? [];
      list.push(i);
      byFamily.set(f, list);
    }
  }

  console.log("Computing similar birds…");
  for (let i = 0; i < birds.length; i++) {
    const target = index[i];
    const candidateIdx = new Set<number>();
    for (const f of target.families) {
      for (const j of byFamily.get(f) ?? []) {
        if (j !== i) candidateIdx.add(j);
      }
    }

    const rawPool =
      candidateIdx.size > 0
        ? [...candidateIdx].map((j) => index[j])
        : index.filter((_, j) => j !== i);

    const pool = capSimilarityPool(rawPool, MAX_SIMILARITY_CANDIDATES);
    const ranked = rankSimilarBirds(target, pool, 8);
    birds[i].similar = ranked.slice(0, 4).map((r) => ({
      slug: r.birdId,
      rank: r.rank,
    }));

    if ((i + 1) % 200 === 0 || i + 1 === birds.length) {
      process.stdout.write(`\r  Similarity ${i + 1}/${birds.length}`);
    }
  }
  process.stdout.write("\n");
  return birds;
}

function buildSearchIndex(birds: BirdRecord[]) {
  return birds.map((b) => ({
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
  }));
}

async function main() {
  const { limit, noPhotos, useFixture, refreshPhotos } = parseArgs(
    process.argv.slice(2),
  );

  const { proportionsPath, colorGroupsPath } = await ensureHbwExtracted({
    useFixture,
  });
  console.log(`\nHBW build\n  proportions: ${proportionsPath}\n  color groups: ${colorGroupsPath}\n`);

  const groups = await loadHbwColorGroups(colorGroupsPath);
  if (groups.length !== 24) {
    console.warn(`Expected 24 color groups, got ${groups.length}`);
  }

  const illustrations = await loadHbwIllustrations(proportionsPath);
  let species = pickSpeciesIllustrations(illustrations);
  console.log(
    `Loaded ${illustrations.length} illustrations → ${species.length} species (by scientific name)`,
  );

  const { list: deduped, removed: nameDupes } = dedupeByCommonName(species);
  species = deduped;
  if (nameDupes > 0) {
    console.log(`Removed ${nameDupes} duplicate common-name species → ${species.length} unique`);
  }

  if (limit > 0) {
    species = species.slice(0, limit);
    console.log(`Limited to ${species.length} species (--limit ${limit})`);
  }

  const photos = await createPhotoResolver({
    fetchPhotos: !noPhotos,
    refreshCache: refreshPhotos,
    delayMs: 200,
  });

  const birds: BirdRecord[] = [];
  let skipped = 0;

  for (let i = 0; i < species.length; i++) {
    const ill = species[i];
    const slug = slugFromScientificName(ill.scientificName);
    if (!slug) {
      skipped++;
      continue;
    }

    const colors = plumageFromHbwProportions(ill.proportions, groups);
    if (colors.length === 0) {
      skipped++;
      continue;
    }

    const theme = buildThemeFromPlumage(colors);
    const imageUrl = await photos.get(ill.scientificName, ill.commonName);
    if (!hasBirdImage(imageUrl)) {
      skipped++;
      continue;
    }

    birds.push({
      slug,
      name: ill.commonName || ill.scientificName,
      scientificName: ill.scientificName,
      region: ill.group || ill.family || ill.order || "",
      imageUrl,
      colors,
      colorFamilies: colorFamiliesFrom(colors),
      theme,
      wcagAA: passesWcagAA(theme),
      updatedAt: new Date().toISOString(),
    });

    if ((i + 1) % 500 === 0 || i + 1 === species.length) {
      process.stdout.write(`\r  Colors ${i + 1}/${species.length}`);
      if ((i + 1) % 500 === 0) await photos.flush();
    }
  }

  process.stdout.write("\n");
  await photos.flush();

  const withSim = withSimilarity(birds);
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await mkdir(path.dirname(INDEX_OUTPUT), { recursive: true });

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        version: 2,
        source: "hbw-dryad",
        generatedAt: new Date().toISOString(),
        birds: withSim,
      },
      null,
      2,
    ),
  );
  await writeFile(INDEX_OUTPUT, JSON.stringify(buildSearchIndex(withSim)));

  console.log(
    `\n✓ Wrote ${withSim.length} birds (${skipped} skipped)\n` +
      `  ${path.relative(process.cwd(), OUTPUT)}\n` +
      `  ${path.relative(process.cwd(), INDEX_OUTPUT)}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
