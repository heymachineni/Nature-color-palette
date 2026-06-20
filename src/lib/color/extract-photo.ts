import { colorDistance } from "./extract";
import { rgbToHex, type RGB } from "./convert";
import { nameColor } from "./naming";
import type { PlumageColor } from "./plumage";

type Bucket = {
  rSum: number;
  gSum: number;
  bSum: number;
  count: number;
};

type Cluster = {
  rep: PlumageColor;
  totalShare: number;
};

export type PhotoExtractOptions = {
  bits?: number;
  alphaThreshold?: number;
  /** CIEDE2000 — buckets closer than this within a family share one swatch. */
  similarThreshold?: number;
  /** Drop clusters whose combined share is below this (percent). */
  minClusterShare?: number;
  /** At most this many swatches per color family (distinct shade groups). */
  maxPerFamily?: number;
};

const DEFAULTS: Required<PhotoExtractOptions> = {
  bits: 6,
  alphaThreshold: 8,
  similarThreshold: 10,
  minClusterShare: 0.35,
  maxPerFamily: 4,
};

function scanBuckets(
  data: Uint8Array | Uint8ClampedArray | Buffer,
  width: number,
  height: number,
  opts: Required<PhotoExtractOptions>,
): { buckets: Map<number, Bucket>; totalPixels: number } {
  const shift = 8 - opts.bits;
  const buckets = new Map<number, Bucket>();
  let totalPixels = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3] ?? 255;
      if (a < opts.alphaThreshold) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const key =
        ((r >> shift) << (opts.bits * 2)) |
        ((g >> shift) << opts.bits) |
        (b >> shift);

      const bucket = buckets.get(key);
      if (bucket) {
        bucket.rSum += r;
        bucket.gSum += g;
        bucket.bSum += b;
        bucket.count += 1;
      } else {
        buckets.set(key, { rSum: r, gSum: g, bSum: b, count: 1 });
      }
      totalPixels += 1;
    }
  }

  return { buckets, totalPixels };
}

function bucketsToColors(
  buckets: Map<number, Bucket>,
  totalPixels: number,
): PlumageColor[] {
  const colors: PlumageColor[] = [];
  for (const bucket of buckets.values()) {
    const rgb: RGB = {
      r: bucket.rSum / bucket.count,
      g: bucket.gSum / bucket.count,
      b: bucket.bSum / bucket.count,
    };
    const hex = rgbToHex(rgb);
    colors.push({
      hex,
      family: nameColor(hex),
      share: Math.round((bucket.count / totalPixels) * 10000) / 100,
    });
  }
  return colors.sort((a, b) => b.share - a.share);
}

/**
 * Group similar buckets inside one family.
 * Hex = highest-share bucket in the group (never averaged).
 * Share = sum of all buckets in the group (for the bar width).
 */
function clusterFamily(
  colors: PlumageColor[],
  similarThreshold: number,
  maxPerFamily: number,
): PlumageColor[] {
  const sorted = [...colors].sort((a, b) => b.share - a.share);
  const clusters: Cluster[] = [];

  for (const c of sorted) {
    const match = clusters.find(
      (cl) => colorDistance(cl.rep.hex, c.hex) < similarThreshold,
    );
    if (match) {
      match.totalShare += c.share;
      if (c.share > match.rep.share) match.rep = c;
    } else {
      clusters.push({ rep: c, totalShare: c.share });
    }
  }

  return clusters
    .sort((a, b) => b.totalShare - a.totalShare)
    .slice(0, maxPerFamily)
    .map((cl) => ({
      hex: cl.rep.hex,
      family: cl.rep.family,
      share: Math.round(cl.totalShare * 100) / 100,
    }));
}

function dedupeSimilarWithinFamilies(
  raw: PlumageColor[],
  opts: Required<PhotoExtractOptions>,
): PlumageColor[] {
  const byFamily = new Map<string, PlumageColor[]>();
  for (const c of raw) {
    const list = byFamily.get(c.family) ?? [];
    list.push(c);
    byFamily.set(c.family, list);
  }

  const out: PlumageColor[] = [];
  for (const [, familyColors] of byFamily) {
    out.push(
      ...clusterFamily(
        familyColors,
        opts.similarThreshold,
        opts.maxPerFamily,
      ),
    );
  }

  return out.sort((a, b) => b.share - a.share);
}

/**
 * Photo plumage extraction:
 * 1. Raw scan — every quantization bucket, exact hex, no global merge
 * 2. Group by color family (red, blue, gray, …)
 * 3. Within each family, cluster similar shades (ΔE) → one existing hex per cluster
 * 4. Drop tiny clusters only
 */
export function extractPhotoPlumageFromPixels(
  data: Uint8Array | Uint8ClampedArray | Buffer,
  width: number,
  height: number,
  options: PhotoExtractOptions = {},
): PlumageColor[] {
  const opts = { ...DEFAULTS, ...options };
  const { buckets, totalPixels } = scanBuckets(data, width, height, opts);
  if (totalPixels === 0) return [];

  const raw = bucketsToColors(buckets, totalPixels);
  const deduped = dedupeSimilarWithinFamilies(raw, opts);
  const pruned = deduped.filter((c) => c.share >= opts.minClusterShare);

  return pruned.length > 0 ? pruned : deduped.slice(0, 12);
}

/** Every raw bucket — no family clustering (debug / compare). */
export function extractRawPlumageFromPixels(
  data: Uint8Array | Uint8ClampedArray | Buffer,
  width: number,
  height: number,
  options: Pick<PhotoExtractOptions, "bits" | "alphaThreshold"> = {},
): PlumageColor[] {
  const opts = { ...DEFAULTS, ...options };
  const { buckets, totalPixels } = scanBuckets(data, width, height, opts);
  if (totalPixels === 0) return [];
  return bucketsToColors(buckets, totalPixels);
}
