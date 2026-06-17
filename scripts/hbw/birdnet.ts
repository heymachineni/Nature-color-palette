import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv";

const ROOT = path.join(process.cwd(), "data", "hbw");
const CSV_PATH = path.join(ROOT, "birdnet-taxonomy.csv");
const CACHE_PATH = path.join(ROOT, "birdnet-images.json");

export type BirdNetImageEntry = {
  url: string;
  attribution?: string;
  license?: string;
};

let imageByScientific: Map<string, BirdNetImageEntry> | null = null;

/** BirdNET hosted image (Macaulay Library via Cornell). */
export function birdNetImageApiUrl(scientificName: string): string {
  return `https://birdnet.cornell.edu/taxonomy/api/image/${encodeURIComponent(scientificName.trim())}?size=medium`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function buildIndexFromCsv(): Promise<Map<string, BirdNetImageEntry>> {
  if (!(await exists(CSV_PATH))) {
    return new Map();
  }

  const text = await readFile(CSV_PATH, "utf-8");
  const rows = parseCsv(text);
  const map = new Map<string, BirdNetImageEntry>();

  for (const row of rows) {
    const sci = (row.scientific_name ?? "").trim();
    const url = (row.image_url ?? "").trim();
    if (!sci || !url.startsWith("http")) continue;
    map.set(sci.toLowerCase(), {
      url,
      attribution: row.image_author || undefined,
      license: row.image_license || undefined,
    });
  }

  await mkdir(ROOT, { recursive: true });
  await writeFile(
    CACHE_PATH,
    JSON.stringify(Object.fromEntries(map), null, 0),
  );

  return map;
}

export async function loadBirdNetImages(): Promise<
  Map<string, BirdNetImageEntry>
> {
  if (imageByScientific) return imageByScientific;

  if (existsSync(CACHE_PATH)) {
    const cached = JSON.parse(
      await readFile(CACHE_PATH, "utf-8"),
    ) as Record<string, BirdNetImageEntry>;
    imageByScientific = new Map(
      Object.entries(cached).map(([k, v]) => [k.toLowerCase(), v]),
    );
    return imageByScientific;
  }

  imageByScientific = await buildIndexFromCsv();
  return imageByScientific;
}

export async function birdNetImageUrl(
  scientificName: string,
): Promise<string> {
  const map = await loadBirdNetImages();
  const fromCsv = map.get(scientificName.trim().toLowerCase())?.url;
  return fromCsv ?? birdNetImageApiUrl(scientificName);
}

export const BIRDNET_CSV_PATH = CSV_PATH;
