import { colorDistance } from "./extract";
import type { PlumageColorData } from "@/types/bird";

/** Max ΔE on the image to include a pixel in the region highlight. */
export const REGION_HIGHLIGHT_DELTA = 22;

/** Map one sampled pixel to the single closest palette swatch. */
export function matchPaletteFromPixel(
  pixelHex: string,
  colors: PlumageColorData[],
): Set<string> {
  if (colors.length === 0) return new Set();

  let nearest = colors[0];
  let bestDist = Infinity;
  for (const c of colors) {
    const d = colorDistance(pixelHex, c.hex);
    if (d < bestDist) {
      bestDist = d;
      nearest = c;
    }
  }

  return new Set([nearest.hex]);
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Map a click inside an object-cover box to image pixel coordinates. */
export function objectCoverPixelAt(
  img: HTMLImageElement,
  clientX: number,
  clientY: number,
  box: DOMRect,
): { x: number; y: number } | null {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return null;

  const cw = box.width;
  const ch = box.height;
  const imageAspect = nw / nh;
  const boxAspect = cw / ch;

  let sx: number;
  let sy: number;
  let sw: number;
  let sh: number;

  if (imageAspect > boxAspect) {
    sh = nh;
    sw = nh * boxAspect;
    sx = (nw - sw) / 2;
    sy = 0;
  } else {
    sw = nw;
    sh = nw / boxAspect;
    sx = 0;
    sy = (nh - sh) / 2;
  }

  const relX = (clientX - box.left) / cw;
  const relY = (clientY - box.top) / ch;
  if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return null;

  return {
    x: Math.min(nw - 1, Math.max(0, Math.floor(sx + relX * sw))),
    y: Math.min(nh - 1, Math.max(0, Math.floor(sy + relY * sh))),
  };
}
