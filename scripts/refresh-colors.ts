/**
 * Re-extract palette colors from cached cutouts and rebuild designer modes.
 * No Wikipedia / network — uses public/birds/{slug}-cutout.webp only.
 *
 * Run:  npx tsx scripts/refresh-colors.ts
 *       npx tsx scripts/refresh-colors.ts rhinoceros-hornbill
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { SEED_BIRDS } from "./birds";
import { extractPalette, type ExtractedColor } from "../src/lib/color/extract";
import { buildDesignerModes } from "../src/lib/color/modes";
import { inferCharacter } from "../src/lib/color/character";
import { generateTokenPairings } from "../src/lib/color/token-pairings";
import { buildVariations } from "../src/lib/color/variations";
import { rankSimilarBirds } from "../src/lib/color/similarity";

function colorTagsFrom(palette: ExtractedColor[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const color of palette) {
    if (!seen.has(color.colorName)) {
      seen.add(color.colorName);
      tags.push(color.colorName);
    }
  }
  return tags;
}

const PUBLIC_DIR = path.join(process.cwd(), "public", "birds");
const OUTPUT = path.join(process.cwd(), "prisma", "seed", "dataset.json");

async function computePalette(
  cutout: Buffer,
  fallback: Buffer,
): Promise<ExtractedColor[]> {
  const { data, info } = await sharp(cutout)
    .ensureAlpha()
    .resize({ width: 720, height: 720, fit: "inside", withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const palette = extractPalette(data, info.width, info.height, {
    centerWeight: false,
    backgroundSubtraction: false,
    saturationBoost: 0,
    alphaThreshold: 210,
    signatureColors: true,
    maxColors: 24,
  });
  if (palette.length > 0) return palette;

  const fb = await sharp(fallback)
    .resize({ width: 640, height: 640, fit: "cover", position: "attention" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return extractPalette(fb.data, fb.info.width, fb.info.height);
}

async function main() {
  const onlySlug = process.argv[2];
  const prior = JSON.parse(readFileSync(OUTPUT, "utf-8")) as {
    birds: Record<string, unknown>[];
  };
  const bySlug = new Map(prior.birds.map((b) => [(b as { slug: string }).slug, b]));
  const queue = onlySlug
    ? SEED_BIRDS.filter((b) => b.slug === onlySlug)
    : SEED_BIRDS;

  if (onlySlug && queue.length === 0) {
    console.error(`Unknown slug: ${onlySlug}`);
    process.exit(1);
  }

  console.log(`\nRefreshing colors for ${queue.length} bird(s)…\n`);

  let updated = 0;
  for (const bird of queue) {
    const cutoutPath = path.join(PUBLIC_DIR, `${bird.slug}-cutout.webp`);
    const heroPath = path.join(PUBLIC_DIR, `${bird.slug}.webp`);
    if (!existsSync(cutoutPath) || !existsSync(heroPath)) {
      console.warn(`  ✗ ${bird.name}: missing image assets`);
      continue;
    }

    const cutout = readFileSync(cutoutPath);
    const hero = readFileSync(heroPath);
    const palette = await computePalette(cutout, hero);
    const designerModes = buildDesignerModes(palette);
    const characterTags = inferCharacter(designerModes[0].curated);
    const pairings = generateTokenPairings(designerModes[0].tokens);
    const variations = buildVariations(palette);

    const existing = bySlug.get(bird.slug) as Record<string, unknown> | undefined;
    if (!existing) {
      console.warn(`  ✗ ${bird.name}: not in dataset.json`);
      continue;
    }

    bySlug.set(bird.slug, {
      ...existing,
      colorTags: colorTagsFrom(palette),
      characterTags,
      paletteColors: palette.map((c, i) => ({
        hex: c.hex,
        rgb: c.rgb,
        dominancePct: c.dominancePct,
        colorName: c.colorName,
        sortOrder: i,
      })),
      designerModes,
      paletteVariations: variations,
      accessibilityResults: pairings.map((p, i) => ({
        foreground: p.foreground,
        background: p.background,
        contrastRatio: p.contrastRatio,
        levelAA: p.levelAA,
        levelAAA: p.levelAAA,
        label: p.label,
        sortOrder: i,
      })),
    });

    const heroHex = designerModes[0].curated.hero.natureHex;
    console.log(
      `  ✓ ${bird.name}: ${palette.length} raw → hero ${heroHex}`,
    );
    updated++;
  }

  const birds = SEED_BIRDS.map((b) => bySlug.get(b.slug)).filter(Boolean);
  const index = birds.map((b) => ({
    id: (b as { slug: string }).slug,
    palette: (b as { paletteColors: { hex: string }[] }).paletteColors.map(
      (c) => c.hex,
    ),
  }));

  for (const bird of birds) {
    const b = bird as {
      slug: string;
      paletteColors: { hex: string }[];
      similar?: unknown[];
    };
    const ranked = rankSimilarBirds(
      { id: b.slug, palette: b.paletteColors.map((c) => c.hex) },
      index,
    );
    b.similar = ranked.map((r) => ({
      slug: r.birdId,
      similarityScore: Math.round(r.similarityScore * 1000) / 1000,
      rank: r.rank,
    }));
  }

  writeFileSync(
    OUTPUT,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), birds },
      null,
      2,
    ),
  );

  console.log(`\n✓ Updated ${updated} bird(s) in ${path.relative(process.cwd(), OUTPUT)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
