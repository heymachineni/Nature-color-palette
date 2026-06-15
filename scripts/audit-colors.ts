/**
 * Audit palette quality: flags birds where hero is muddy/dark but vivid
 * plumage exists in the raw palette, or signature colors are missing.
 *
 * Run:  npx tsx scripts/audit-colors.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { SEED_BIRDS } from "./birds";
import { extractPalette, colorDistance } from "../src/lib/color/extract";
import { rgbToHsl, hexToRgb } from "../src/lib/color/convert";

const PUBLIC = path.join(process.cwd(), "public", "birds");
const DATASET = path.join(process.cwd(), "prisma", "seed", "dataset.json");

function sat(hex: string) {
  return rgbToHsl(hexToRgb(hex)).s;
}
function lit(hex: string) {
  return rgbToHsl(hexToRgb(hex)).l;
}

async function vividScan(data: Buffer, w: number, h: number) {
  const hues = new Map<number, number>();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 210) continue;
      const { s, l, h: hue } = rgbToHsl({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });
      if (s < 45 || l < 25 || l > 88) continue;
      const bucket = Math.round(hue / 15) * 15;
      hues.set(bucket, (hues.get(bucket) ?? 0) + 1);
    }
  }
  return [...hues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

async function main() {
  const { birds } = JSON.parse(readFileSync(DATASET, "utf-8")) as {
    birds: {
      slug: string;
      name: string;
      paletteColors: { hex: string; dominancePct: number }[];
      designerModes: { curated: { hero: { natureHex: string } } }[];
    }[];
  };
  const bySlug = new Map(birds.map((b) => [b.slug, b]));

  const issues: string[] = [];

  for (const seed of SEED_BIRDS) {
    const b = bySlug.get(seed.slug);
    if (!b) {
      issues.push(`${seed.slug}: missing from dataset`);
      continue;
    }

    const cutout = path.join(PUBLIC, `${seed.slug}-cutout.webp`);
    const { data, info } = await sharp(cutout)
      .ensureAlpha()
      .resize({ width: 720, height: 720, fit: "inside", withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const fresh = extractPalette(data, info.width, info.height, {
      centerWeight: false,
      backgroundSubtraction: false,
      saturationBoost: 0,
      alphaThreshold: 210,
      signatureColors: true,
      maxColors: 24,
    });

    const hero = b.designerModes[0].curated.hero.natureHex;
    const heroS = sat(hero);
    const heroL = lit(hero);

    const vividInRaw = b.paletteColors.filter((c) => sat(c.hex) > 48 && lit(c.hex) >= 25);
    const bestVivid = vividInRaw.sort((a, b) => sat(b.hex) - sat(a.hex))[0];

    if (bestVivid && heroS < 35 && sat(bestVivid.hex) - heroS > 18) {
      issues.push(
        `${seed.slug}: hero ${hero} (s${heroS.toFixed(0)}) but vivid ${bestVivid.hex} (s${sat(bestVivid.hex).toFixed(0)}) in raw`,
      );
    }

    if (heroL < 22 && heroS < 30 && bestVivid) {
      issues.push(
        `${seed.slug}: dark muddy hero ${hero} — expected ${bestVivid.hex}`,
      );
    }

    for (let i = 0; i < 3; i++) {
      const s = b.paletteColors[i];
      const f = fresh[i];
      if (s && f && colorDistance(s.hex, f.hex) > 22) {
        issues.push(
          `${seed.slug}: stored/raw drift at #${i} ${s.hex} vs ${f.hex}`,
        );
        break;
      }
    }

    const scan = await vividScan(data, info.width, info.height);
    if (scan.length && heroS < 32) {
      const heroHue = rgbToHsl(hexToRgb(hero)).h;
      const hasVividHue = scan.some(([h]) => Math.abs(h - heroHue) > 30 && h > 0);
      if (hasVividHue && bestVivid && colorDistance(hero, bestVivid.hex) > 25) {
        issues.push(
          `${seed.slug}: image has vivid hues but hero is ${hero}`,
        );
      }
    }
  }

  console.log(`\nAudited ${SEED_BIRDS.length} birds`);
  console.log(`Issues: ${issues.length}\n`);
  for (const i of issues) console.log(`  • ${i}`);
  if (!issues.length) console.log("  ✓ All palettes look consistent\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
