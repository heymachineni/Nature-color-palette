import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { extractPalette } from "../src/lib/color/extract";

async function main() {
  const slug = process.argv[2] ?? "northern-cardinal";
  const hero = path.join(process.cwd(), "public", "birds", `${slug}.webp`);
  const buffer = await readFile(hero);

  const { data, info } = await sharp(buffer)
    .resize({ width: 640, height: 640, fit: "cover", position: "attention" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const palette = extractPalette(data, info.width, info.height);
  console.log(`Extracted palette for ${slug}:`);
  for (const c of palette) {
    console.log(`  ${c.hex}  ${c.colorName.padEnd(7)} ${c.dominancePct}%`);
  }
}

main();
