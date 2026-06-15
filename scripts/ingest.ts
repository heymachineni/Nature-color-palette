/**
 * Deterministic ingest pipeline.
 *
 *   image (Wikimedia) -> resize -> quantize -> dedupe -> dominance
 *                     -> palette variations (60/30/10)
 *                     -> WCAG pairings -> color tags
 *   then cross-bird palette similarity, written to prisma/seed/dataset.json
 *
 * No AI APIs. Run with:  npm run ingest
 */
import { writeFile, mkdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";
import { SEED_BIRDS, type SeedBird } from "./birds";
import { extractPalette, type ExtractedColor } from "../src/lib/color/extract";
import { buildVariations } from "../src/lib/color/variations";
import { buildDesignerModes } from "../src/lib/color/modes";
import { inferCharacter } from "../src/lib/color/character";
import { generateTokenPairings } from "../src/lib/color/token-pairings";
import { rankSimilarBirds } from "../src/lib/color/similarity";

const USER_AGENT = "NaturePalette/0.1 (design education project; contact: local)";
const PUBLIC_DIR = path.join(process.cwd(), "public", "birds");
const OUTPUT = path.join(process.cwd(), "prisma", "seed", "dataset.json");

type WikiSummary = {
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  originalimage?: { source?: string };
  thumbnail?: { source?: string };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(
  url: string,
  retries = 5,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = retryAfter
        ? retryAfter * 1000
        : Math.min(15000, 1500 * 2 ** attempt);
      await sleep(wait);
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  throw new Error(`exhausted retries for ${url}`);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);
  return (await res.json()) as T;
}

async function fetchSummary(title: string): Promise<WikiSummary> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, "_"),
  )}`;
  return fetchJson<WikiSummary>(url);
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchImageCredit(imageUrl: string): Promise<{
  credit?: string;
  license?: string;
}> {
  try {
    const filename = decodeURIComponent(imageUrl.split("/").pop() ?? "");
    if (!filename) return {};
    const api = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&format=json&titles=${encodeURIComponent(
      `File:${filename}`,
    )}`;
    const data = await fetchJson<any>(api);
    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0] as any;
    const meta = page?.imageinfo?.[0]?.extmetadata ?? {};
    const artist = meta?.Artist?.value ? stripHtml(meta.Artist.value) : undefined;
    const license = meta?.LicenseShortName?.value
      ? stripHtml(meta.LicenseShortName.value)
      : undefined;
    return { credit: artist, license };
  } catch {
    return {};
  }
}

function shortDescription(extract: string | undefined): string {
  if (!extract) return "";
  const sentences = extract.split(/(?<=\.)\s+/);
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > 320) break;
    out += (out ? " " : "") + s;
  }
  return out || extract.slice(0, 320);
}

function colorTagsFrom(palette: ExtractedColor[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  // Lead colors first so search relevance follows dominance.
  for (const color of palette) {
    if (!seen.has(color.colorName)) {
      seen.add(color.colorName);
      tags.push(color.colorName);
    }
  }
  return tags;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

const CUTOUT_TIMEOUT_MS = 180_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms,
    );
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/**
 * Subject segmentation (on-device, no cloud API): isolate the bird from its
 * background with a local U²-Net model, then clean the matte and trim to the
 * subject. The result is used both for color extraction (so colors come from
 * the bird, not the bark/foliage/sky) and as a clean cutout for the gallery.
 */
async function makeCutout(source: Buffer): Promise<Buffer> {
  const png = await sharp(source).png().toBuffer();
  const removed = await removeBackground(
    new Blob([new Uint8Array(png)], { type: "image/png" }),
    { output: { format: "image/png" } },
  );
  const cut = Buffer.from(await removed.arrayBuffer());

  // Harden the alpha matte: drop faint semi-transparent ghosts (stray
  // branches/halo), keep a soft 1px edge.
  const alpha = await sharp(cut)
    .ensureAlpha()
    .extractChannel(3)
    .threshold(140)
    .blur(0.5)
    .toBuffer();

  // Re-attach the cleaned matte in its own pipeline. Mixing joinChannel with
  // trim/resize in a single pipeline corrupts the output in sharp, so finalize
  // to a buffer first, then crop + size separately.
  const matte = await sharp(cut)
    .ensureAlpha()
    .removeAlpha()
    .joinChannel(alpha)
    .png()
    .toBuffer();

  return sharp(matte)
    .trim({ threshold: 12 })
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toBuffer();
}

/** Extract bird-only colors from the cutout; fall back to the photo if the
 * matte came back essentially empty. */
async function computePalette(
  cutout: Buffer,
  fallbackSource: Buffer,
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

  // Fallback: original heuristic on a subject-focused crop of the photo.
  const fb = await sharp(fallbackSource)
    .resize({ width: 640, height: 640, fit: "cover", position: "attention" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return extractPalette(fb.data, fb.info.width, fb.info.height);
}

type BirdRecord = {
  slug: string;
  name: string;
  scientificName: string;
  description: string;
  habitat: string;
  region: string;
  imageUrl: string;
  thumbUrl: string;
  imageCredit: string | null;
  imageLicense: string | null;
  sourceUrl: string | null;
  colorTags: string[];
  paletteColors: any[];
  paletteVariations: any[];
  designerModes: any[];
  characterTags: string[];
  accessibilityResults: any[];
  similar?: any[];
};

async function processBird(
  bird: SeedBird,
  prior: BirdRecord | undefined,
  index: number,
  total: number,
): Promise<BirdRecord> {
  process.stdout.write(`  [${index + 1}/${total}] ${bird.name} … `);
  const heroPath = path.join(PUBLIC_DIR, `${bird.slug}.webp`);
  const cutoutPath = path.join(PUBLIC_DIR, `${bird.slug}-cutout.webp`);
  const hasHero = await exists(heroPath);
  const hasMeta = Boolean(prior?.description);

  let summary: WikiSummary | undefined;
  let remoteImage: string | undefined;

  // Only touch the network when something is actually missing.
  if (!hasHero || !hasMeta) {
    summary = await fetchSummary(bird.wikiTitle);
    remoteImage =
      bird.imageUrl ??
      summary.originalimage?.source ??
      summary.thumbnail?.source;
  }

  let sourceBuffer: Buffer;
  if (hasHero) {
    sourceBuffer = await readFile(heroPath);
  } else {
    if (!remoteImage) throw new Error("no image found");
    const res = await fetchWithRetry(remoteImage);
    const original = Buffer.from(await res.arrayBuffer());
    // Hero keeps the full, uncropped photo so the whole bird stays visible.
    await sharp(original)
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(heroPath);
    sourceBuffer = original;
  }

  // Subject cutout (cached — segmentation is the slow step). Used for color
  // extraction and as the clean, fully-visible card image.
  let cutoutBuffer: Buffer;
  if (await exists(cutoutPath)) {
    cutoutBuffer = await readFile(cutoutPath);
  } else {
    try {
      cutoutBuffer = await withTimeout(
        makeCutout(sourceBuffer),
        CUTOUT_TIMEOUT_MS,
        "Background removal",
      );
      await writeFile(cutoutPath, cutoutBuffer);
    } catch (err) {
      process.stdout.write(`cutout skipped (${(err as Error).message}) … `);
      cutoutBuffer = await sharp(sourceBuffer)
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer();
    }
  }

  const palette = await computePalette(cutoutBuffer, sourceBuffer);
  const designerModes = buildDesignerModes(palette);
  const characterTags = inferCharacter(designerModes[0].curated);
  const pairings = generateTokenPairings(designerModes[0].tokens);
  const variations = buildVariations(palette); // legacy compat in JSON

  let imageCredit = prior?.imageCredit ?? null;
  let imageLicense = prior?.imageLicense ?? null;
  // Refresh attribution whenever we (re)downloaded the photo, so a swapped
  // source image never keeps the previous photo's credit.
  if (remoteImage && (!hasHero || !imageCredit || !imageLicense)) {
    const credit = await fetchImageCredit(remoteImage);
    imageCredit = credit.credit ?? imageCredit;
    imageLicense = credit.license ?? imageLicense;
  }

  process.stdout.write(
    `${palette.length} raw → ${designerModes.length} mode(s)${
      hasHero && hasMeta ? " (cached)" : ""
    }\n`,
  );
  if (process.stdout.isTTY) process.stdout.write("");

  return {
    slug: bird.slug,
    name: bird.name,
    scientificName: bird.scientificName,
    description: prior?.description || shortDescription(summary?.extract),
    habitat: bird.habitat,
    region: bird.region,
    imageUrl: `/birds/${bird.slug}.webp`,
    thumbUrl: `/birds/${bird.slug}-cutout.webp`,
    imageCredit,
    imageLicense,
    sourceUrl: prior?.sourceUrl ?? summary?.content_urls?.desktop?.page ?? null,
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
  };
}

function withSimilarity(birds: BirdRecord[]): BirdRecord[] {
  const index = birds.map((b) => ({
    id: b.slug,
    palette: b.paletteColors.map((c: any) => c.hex),
  }));
  for (const bird of birds) {
    const ranked = rankSimilarBirds(
      { id: bird.slug, palette: bird.paletteColors.map((c: any) => c.hex) },
      index,
    );
    bird.similar = ranked.map((r) => ({
      slug: r.birdId,
      similarityScore: Math.round(r.similarityScore * 1000) / 1000,
      rank: r.rank,
    }));
  }
  return birds;
}

async function save(birds: BirdRecord[]) {
  await writeFile(
    OUTPUT,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), birds: withSimilarity(birds) },
      null,
      2,
    ),
  );
}

async function loadPrior(): Promise<Map<string, BirdRecord>> {
  const map = new Map<string, BirdRecord>();
  if (await exists(OUTPUT)) {
    try {
      const data = JSON.parse(await readFile(OUTPUT, "utf-8"));
      for (const b of data.birds ?? []) map.set(b.slug, b);
    } catch {
      /* ignore corrupt cache */
    }
  }
  return map;
}

function orderedBirds(store: Map<string, BirdRecord>): BirdRecord[] {
  return SEED_BIRDS.map((b) => store.get(b.slug)).filter(
    (b): b is BirdRecord => b !== undefined,
  );
}

async function saveStore(store: Map<string, BirdRecord>) {
  await save(orderedBirds(store));
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });
  await mkdir(path.dirname(OUTPUT), { recursive: true });

  const onlySlug = process.argv[2];
  const prior = await loadPrior();
  const store = new Map<string, BirdRecord>(prior);
  const queue = onlySlug
    ? SEED_BIRDS.filter((b) => b.slug === onlySlug)
    : SEED_BIRDS;

  if (onlySlug && queue.length === 0) {
    console.error(`Unknown slug: ${onlySlug}`);
    process.exit(1);
  }

  console.log(
    `\nIngesting ${queue.length} bird(s) (resumable, ${prior.size} in dataset)…\n`,
  );

  const total = SEED_BIRDS.length;
  let failed = 0;
  for (const bird of queue) {
    const i = SEED_BIRDS.findIndex((b) => b.slug === bird.slug);
    try {
      const record = await processBird(bird, store.get(bird.slug), i, total);
      store.set(bird.slug, record);
      await saveStore(store);
    } catch (err) {
      failed++;
      console.error(`  ✗ [${i + 1}/${total}] ${bird.name}: ${(err as Error).message}`);
    }
    const hasAssets =
      (await exists(path.join(PUBLIC_DIR, `${bird.slug}.webp`))) &&
      (await exists(path.join(PUBLIC_DIR, `${bird.slug}-cutout.webp`)));
    await sleep(hasAssets ? 350 : 900);
  }

  await saveStore(store);
  console.log(
    `\n✓ Wrote ${store.size}/${SEED_BIRDS.length} birds to ${path.relative(
      process.cwd(),
      OUTPUT,
    )}${failed ? ` (${failed} failed this run)` : ""}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
