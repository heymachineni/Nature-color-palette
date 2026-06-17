import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { birdNetImageUrl, loadBirdNetImages } from "./birdnet";

const CACHE = path.join(process.cwd(), "data", "hbw", "photo-cache.json");
const PLACEHOLDER = "/images/bird-placeholder.svg";

/** BirdNET returns this generic silhouette when no Macaulay/iNat photo exists. */
const BIRDNET_PLACEHOLDER_BYTES = 1646;

type PhotoCache = Record<string, string>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loadCache(): Promise<PhotoCache> {
  try {
    await access(CACHE);
    return JSON.parse(await readFile(CACHE, "utf-8")) as PhotoCache;
  } catch {
    return {};
  }
}

async function saveCache(cache: PhotoCache) {
  await mkdir(path.dirname(CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify(cache, null, 2));
}

/** True when BirdNET serves the generic default silhouette, not a real species photo. */
export async function isBirdNetPlaceholder(url: string): Promise<boolean> {
  if (!url.includes("birdnet.cornell.edu/taxonomy/api/image")) {
    return false;
  }
  try {
    const resp = await fetch(url, { method: "HEAD" });
    if (!resp.ok) return true;
    const len = Number(resp.headers.get("content-length") ?? 0);
    return len > 0 && len <= BIRDNET_PLACEHOLDER_BYTES;
  } catch {
    return true;
  }
}

async function fetchInaturalistPhoto(
  scientificName: string,
  commonName?: string,
): Promise<string | null> {
  const exactSci = scientificName.trim();

  const byScience = await inaturalistTaxonPhoto(exactSci, exactSci);
  if (byScience) return byScience;

  if (commonName?.trim()) {
    const byCommon = await inaturalistTaxonPhoto(commonName.trim(), exactSci);
    if (byCommon) return byCommon;
  }

  return null;
}

async function inaturalistTaxonPhoto(
  query: string,
  expectedScientific: string,
): Promise<string | null> {
  const url = new URL("https://api.inaturalist.org/v1/taxa");
  url.searchParams.set("q", query);
  url.searchParams.set("rank", "species");
  url.searchParams.set("per_page", "5");
  url.searchParams.set("is_active", "true");

  const resp = await fetch(url);
  if (!resp.ok) return null;

  const data = (await resp.json()) as {
    results?: {
      name?: string;
      matched_term?: string;
      default_photo?: { medium_url?: string };
    }[];
  };

  const expected = expectedScientific.toLowerCase();
  const hit =
    data.results?.find((r) => r.name?.toLowerCase() === expected) ??
    data.results?.find((r) =>
      r.matched_term?.toLowerCase().includes(expected.split(" ")[0] ?? ""),
    );

  return hit?.default_photo?.medium_url ?? null;
}

export async function resolveBirdPhoto(
  scientificName: string,
  cache: PhotoCache,
  opts: {
    fetchPhotos: boolean;
    commonName?: string;
  },
): Promise<string> {
  const key = scientificName.toLowerCase();
  if (cache[key]) return cache[key];

  const sciSlug = scientificName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const sciLocal = path.join(
    process.cwd(),
    "public",
    "birds",
    `${sciSlug}.webp`,
  );
  try {
    await access(sciLocal);
    cache[key] = `/birds/${sciSlug}.webp`;
    return cache[key];
  } catch {
    /* no local image */
  }

  if (!opts.fetchPhotos) return PLACEHOLDER;

  let birdnet: string | null = null;
  try {
    const candidate = await birdNetImageUrl(scientificName);
    if (candidate && !(await isBirdNetPlaceholder(candidate))) {
      birdnet = candidate;
    }
  } catch {
    birdnet = null;
  }

  if (birdnet) {
    cache[key] = birdnet;
    return birdnet;
  }

  try {
    const inat = await fetchInaturalistPhoto(
      scientificName,
      opts.commonName,
    );
    if (inat) {
      cache[key] = inat;
      return inat;
    }
  } catch {
    /* network error */
  }

  cache[key] = PLACEHOLDER;
  return PLACEHOLDER;
}

export async function createPhotoResolver(opts: {
  fetchPhotos: boolean;
  refreshCache?: boolean;
  delayMs?: number;
}) {
  const cache = opts.refreshCache ? {} : await loadCache();
  let inatFetches = 0;

  if (opts.fetchPhotos) {
    try {
      const map = await loadBirdNetImages();
      console.log(`BirdNET image index: ${map.size} species`);
    } catch (err) {
      console.warn(
        `BirdNET images unavailable (${(err as Error).message}) — iNaturalist only`,
      );
    }
  }

  return {
    async get(
      scientificName: string,
      commonName?: string,
    ): Promise<string> {
      const url = await resolveBirdPhoto(scientificName, cache, {
        fetchPhotos: opts.fetchPhotos,
        commonName,
      });

      if (
        opts.fetchPhotos &&
        url.includes("inaturalist") &&
        opts.delayMs
      ) {
        inatFetches++;
        if (inatFetches % 15 === 0) await sleep(opts.delayMs);
      }

      return url;
    },
    async flush() {
      await saveCache(cache);
    },
    cache,
  };
}

export { PLACEHOLDER };
