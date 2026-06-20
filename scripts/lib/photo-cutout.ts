import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";
import { extractPhotoPlumageFromPixels } from "../../src/lib/color/extract-photo";
import type { PlumageColor } from "../../src/lib/color/plumage";

export const CUTOUT_CACHE_DIR = path.join(
  process.cwd(),
  "scripts",
  ".cache",
  "cutouts",
);
export const MAX_EDGE = 1200;

export function cutoutPath(slug: string, imageUrl: string): string {
  const hash = createHash("sha1").update(imageUrl).digest("hex").slice(0, 8);
  return path.join(CUTOUT_CACHE_DIR, `${slug}-${hash}-cutout.png`);
}

export async function fetchImageBuffer(url: string): Promise<Buffer> {
  const localPath = url.startsWith("/")
    ? path.join(process.cwd(), "public", url.slice(1))
    : null;

  if (localPath) {
    return readFile(localPath);
  }

  const res = await fetch(url, {
    headers: { "User-Agent": "BirdPalette/1.0 (photo build)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function loadOrCreateCutout(
  slug: string,
  imageUrl: string,
  opts?: { quiet?: boolean },
): Promise<Buffer> {
  const cached = cutoutPath(slug, imageUrl);
  try {
    await access(cached);
    return readFile(cached);
  } catch {
    /* generate */
  }

  if (!opts?.quiet) {
    console.log(`  ↓ fetch ${slug}`);
  }

  const raw = await fetchImageBuffer(imageUrl);
  const resized = await sharp(raw)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  if (!opts?.quiet) {
    console.log(`  ✂ bg remove ${slug}`);
  }

  const blob = await removeBackground(
    new Blob([new Uint8Array(resized)], { type: "image/png" }),
  );
  const cutout = Buffer.from(await blob.arrayBuffer());
  await mkdir(CUTOUT_CACHE_DIR, { recursive: true });
  await writeFile(cached, cutout);
  return cutout;
}

export async function extractColorsFromPhoto(
  slug: string,
  imageUrl: string,
  opts?: { quiet?: boolean },
): Promise<PlumageColor[]> {
  const cutout = await loadOrCreateCutout(slug, imageUrl, opts);
  const { data, info } = await sharp(cutout)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return extractPhotoPlumageFromPixels(data, info.width, info.height);
}

export async function hasCachedCutout(
  slug: string,
  imageUrl: string,
): Promise<boolean> {
  try {
    await access(cutoutPath(slug, imageUrl));
    return true;
  } catch {
    return false;
  }
}
