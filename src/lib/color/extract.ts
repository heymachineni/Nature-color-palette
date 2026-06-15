import { differenceCiede2000 } from "culori";
import { rgbToHex, rgbToString, rgbToHsl, type RGB } from "./convert";
import { nameColor } from "./naming";

export type ExtractedColor = {
  hex: string;
  rgb: string;
  rgbValues: RGB;
  dominancePct: number;
  colorName: string;
};

const deltaE = differenceCiede2000();

/** Perceptual distance (CIEDE2000) between two hex colors. */
export function colorDistance(hexA: string, hexB: string): number {
  return deltaE(hexA, hexB);
}

type Bucket = {
  rWeighted: number;
  gWeighted: number;
  bWeighted: number;
  weight: number;
};

export type ExtractOptions = {
  /** quantization bits per channel (5 = 32 levels). */
  bits?: number;
  /** ΔE below which two colors are merged. */
  mergeThreshold?: number;
  /** maximum swatches returned. */
  maxColors?: number;
  /** weight centre pixels more (subject) than edges (background). */
  centerWeight?: boolean;
  /** chroma weighting strength (>0 suppresses neutral backgrounds). */
  saturationBoost?: number;
  /** subtract colors learned from the image border (background). */
  backgroundSubtraction?: boolean;
  /** alpha below this is treated as background and skipped (0–255). */
  alphaThreshold?: number;
  /** Merge vivid plumage hues so signature colors surface even when branch/tail dominate. */
  signatureColors?: boolean;
};

const DEFAULTS: Required<ExtractOptions> = {
  bits: 5,
  mergeThreshold: 8,
  maxColors: 8,
  centerWeight: true,
  saturationBoost: 1,
  backgroundSubtraction: true,
  alphaThreshold: 125,
  signatureColors: false,
};

function rgbDistanceSq(r1: number, g1: number, b1: number, c: RGB): number {
  const dr = r1 - c.r;
  const dg = g1 - c.g;
  const db = b1 - c.b;
  return dr * dr + dg * dg + db * db;
}

type RegionColor = { rgb: RGB; share: number };

/** Dominant colors found along the image border (background candidates). */
function learnBorderColors(
  pixels: Uint8Array | Uint8ClampedArray | Buffer,
  width: number,
  height: number,
): RegionColor[] {
  const band = Math.max(2, Math.floor(Math.min(width, height) * 0.14));
  type Acc = { c: number; r: number; g: number; b: number };
  const hist = new Map<number, Acc>();
  let total = 0;
  for (let y = 0; y < height; y++) {
    const edgeRow = y < band || y >= height - band;
    for (let x = 0; x < width; x++) {
      if (!edgeRow && x >= band && x < width - band) continue;
      const i = (y * width + x) * 4;
      if (pixels[i + 3] !== undefined && pixels[i + 3] < 125) continue;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      let acc = hist.get(key);
      if (!acc) {
        acc = { c: 0, r: 0, g: 0, b: 0 };
        hist.set(key, acc);
      }
      acc.c += 1; acc.r += r; acc.g += g; acc.b += b;
      total += 1;
    }
  }
  if (total === 0) return [];
  return Array.from(hist.values())
    .map((a) => ({
      rgb: { r: a.r / a.c, g: a.g / a.c, b: a.b / a.c } as RGB,
      share: a.c / total,
    }))
    .filter((a) => a.share > 0.006)
    .sort((a, b) => b.share - a.share)
    .slice(0, 18);
}

/**
 * Flood-fills background from the image edges ("magic wand"): starting at the
 * border, it grows through all connected pixels that match a learned background
 * color. This removes foliage / water / sky / bokeh that touches the frame —
 * regardless of where the bird sits — while the bird (different colors, not
 * connected to the edge) stops the fill and is preserved. Fully deterministic.
 */
function floodFillBackground(
  pixels: Uint8Array | Uint8ClampedArray | Buffer,
  width: number,
  height: number,
  bgColors: RegionColor[],
  toleranceSq: number,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  if (bgColors.length === 0) return mask;

  const isBg = (p: number) => {
    const i = p * 4;
    if (pixels[i + 3] !== undefined && pixels[i + 3] < 125) return true;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    for (const c of bgColors) {
      if (rgbDistanceSq(r, g, b, c.rgb) < toleranceSq) return true;
    }
    return false;
  };

  const stack = new Int32Array(width * height);
  let sp = 0;
  const push = (p: number) => {
    if (mask[p] === 0 && isBg(p)) {
      mask[p] = 1;
      stack[sp++] = p;
    }
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (sp > 0) {
    const p = stack[--sp];
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (y > 0) push(p - width);
    if (y < height - 1) push(p + width);
  }

  return mask;
}

/** Weight for signature plumage — HSL saturation, not relative chroma on dark pixels. */
function signaturePixelWeight(r: number, g: number, b: number): number {
  const { s, l } = rgbToHsl({ r, g, b });
  // Dark feather shadows read as "chroma" with (max-min)/max — reject them.
  if (s < 38) return 0;
  if (l < 22 || l > 90) return 0;
  return (s / 100) ** 2 * 10 + 0.08;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Finds vivid plumage hues weighted by saturation² — surfaces a peacock's blue
 * neck or a goldfinch's yellow even when mossy branch / green tail dominate
 * pixel counts in the cutout matte.
 */
function extractSignatureColors(
  pixels: Uint8Array | Uint8ClampedArray | Buffer,
  width: number,
  height: number,
  opts: Required<ExtractOptions>,
  bgMask: Uint8Array,
): { hex: string; rgb: RGB; weight: number }[] {
  const shift = 8 - opts.bits;
  const buckets = new Map<number, Bucket>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * 4;
      if (pixels[i + 3] !== undefined && pixels[i + 3] < opts.alphaThreshold)
        continue;
      if (bgMask[p] === 1) continue;

      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      const weight = signaturePixelWeight(r, g, b);
      if (weight <= 0) continue;

      const key =
        ((r >> shift) << (opts.bits * 2)) |
        ((g >> shift) << opts.bits) |
        (b >> shift);

      const bucket = buckets.get(key);
      if (bucket) {
        bucket.rWeighted += r * weight;
        bucket.gWeighted += g * weight;
        bucket.bWeighted += b * weight;
        bucket.weight += weight;
      } else {
        buckets.set(key, {
          rWeighted: r * weight,
          gWeighted: g * weight,
          bWeighted: b * weight,
          weight,
        });
      }
    }
  }

  const candidates = Array.from(buckets.values())
    .map((bucket) => ({
      rgb: {
        r: bucket.rWeighted / bucket.weight,
        g: bucket.gWeighted / bucket.weight,
        b: bucket.bWeighted / bucket.weight,
      } as RGB,
      weight: bucket.weight,
    }))
    .sort((a, b) => b.weight - a.weight);

  const merged: { hex: string; rgb: RGB; weight: number }[] = [];
  for (const candidate of candidates) {
    const hex = rgbToHex(candidate.rgb);
    const near = merged.find(
      (m) => colorDistance(m.hex, hex) < opts.mergeThreshold,
    );
    if (near) {
      near.weight += candidate.weight;
    } else {
      merged.push({ hex, rgb: candidate.rgb, weight: candidate.weight });
      if (merged.length >= 5) break;
    }
  }
  return merged.sort((a, b) => b.weight - a.weight);
}

function mergeDominantAndSignature(
  dominant: { hex: string; rgb: RGB; weight: number }[],
  signatures: { hex: string; rgb: RGB; weight: number }[],
  maxColors: number,
  mergeThreshold: number,
): { hex: string; rgb: RGB; weight: number }[] {
  const out: { hex: string; rgb: RGB; weight: number }[] = [...dominant];

  for (const sig of signatures) {
    const { s } = rgbToHsl(sig.rgb);
    if (s < 35) continue;

    const near = out.find((o) => colorDistance(o.hex, sig.hex) < mergeThreshold);
    if (near) {
      // Keep the dominant bucket's weight; signature only ensures the hue is present.
      continue;
    }

    const sigHue = rgbToHsl(sig.rgb).h;
    const hasSimilarHue = out.some((o) => {
      const { s: os, h: oh } = rgbToHsl(o.rgb);
      return os >= 35 && hueDistance(sigHue, oh) < 22;
    });
    if (hasSimilarHue) continue;

    out.push({ ...sig });
  }

  // Raw palette = true frequency order (black body first when it dominates).
  out.sort((a, b) => b.weight - a.weight);
  return out.slice(0, maxColors);
}

/**
 * Deterministic palette extraction tuned for wildlife photography.
 *
 * 1. Learn background colors from the border and subtract them.
 * 2. Center-weighted, chroma-weighted accumulation (suppresses muddy/neutral
 *    backgrounds while a floor keeps real black/white/gray plumage).
 * 3. Uniform quantization + popularity ranking.
 * 4. Perceptual de-duplication via CIEDE2000.
 *
 * @param pixels RGBA pixel data (4 channels)
 */
export function extractPalette(
  pixels: Uint8Array | Uint8ClampedArray | Buffer,
  width: number,
  height: number,
  options: ExtractOptions = {},
): ExtractedColor[] {
  const opts = { ...DEFAULTS, ...options };
  const shift = 8 - opts.bits;
  const buckets = new Map<number, Bucket>();

  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const maxDist = Math.hypot(cx, cy) || 1;

  const bgMask = opts.backgroundSubtraction
    ? floodFillBackground(
        pixels,
        width,
        height,
        learnBorderColors(pixels, width, height),
        52 * 52,
      )
    : new Uint8Array(width * height);

  let totalImageWeight = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (pixels[i + 3] !== undefined && pixels[i + 3] < opts.alphaThreshold)
        continue;
      if (bgMask[p] === 1) continue; // edge-connected background

      let weight = 1;

      if (opts.centerWeight) {
        const dist = Math.hypot(x - cx, y - cy) / maxDist;
        weight *= Math.exp(-(dist * dist) * 1.1);
      }

      if (opts.saturationBoost > 0) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const chroma = (max - min) / 255;
        const floor = 0.45;
        weight *= floor + (1 - floor) * Math.min(1, chroma * 2.2);
      }

      totalImageWeight += weight;

      const key =
        ((r >> shift) << (opts.bits * 2)) |
        ((g >> shift) << opts.bits) |
        (b >> shift);

      const bucket = buckets.get(key);
      if (bucket) {
        bucket.rWeighted += r * weight;
        bucket.gWeighted += g * weight;
        bucket.bWeighted += b * weight;
        bucket.weight += weight;
      } else {
        buckets.set(key, {
          rWeighted: r * weight,
          gWeighted: g * weight,
          bWeighted: b * weight,
          weight,
        });
      }
    }
  }

  const candidates = Array.from(buckets.values())
    .map((bucket) => ({
      rgb: {
        r: bucket.rWeighted / bucket.weight,
        g: bucket.gWeighted / bucket.weight,
        b: bucket.bWeighted / bucket.weight,
      } as RGB,
      weight: bucket.weight,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 48);

  const merged: { hex: string; rgb: RGB; weight: number }[] = [];
  for (const candidate of candidates) {
    const hex = rgbToHex(candidate.rgb);
    const near = merged.find(
      (m) => colorDistance(m.hex, hex) < opts.mergeThreshold,
    );
    if (near) {
      const total = near.weight + candidate.weight;
      near.rgb = {
        r: (near.rgb.r * near.weight + candidate.rgb.r * candidate.weight) / total,
        g: (near.rgb.g * near.weight + candidate.rgb.g * candidate.weight) / total,
        b: (near.rgb.b * near.weight + candidate.rgb.b * candidate.weight) / total,
      };
      near.hex = rgbToHex(near.rgb);
      near.weight = total;
    } else {
      merged.push({ hex, rgb: candidate.rgb, weight: candidate.weight });
    }
  }

  merged.sort((a, b) => b.weight - a.weight);

  let top = merged.slice(0, opts.maxColors);
  if (opts.signatureColors) {
    const signatures = extractSignatureColors(
      pixels,
      width,
      height,
      opts,
      bgMask,
    );
    top = mergeDominantAndSignature(
      merged,
      signatures,
      opts.maxColors,
      opts.mergeThreshold,
    );
  }

  const weightBase = totalImageWeight || top.reduce((sum, c) => sum + c.weight, 0) || 1;

  return top.map((c) => ({
    hex: c.hex,
    rgb: rgbToString(c.rgb),
    rgbValues: c.rgb,
    dominancePct: Math.round((c.weight / weightBase) * 1000) / 10,
    colorName: nameColor(c.hex),
  }));
}
