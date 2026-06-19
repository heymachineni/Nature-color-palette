import type { BirdSummary } from "@/types/bird";
import { normalizeColorQuery } from "@/lib/color/naming";

/** Normalize hex for comparison (# optional, 3- or 6-digit). */
export function normalizeHex(hex: string): string {
  let clean = hex.trim().replace(/^#/, "").toLowerCase();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return clean.slice(0, 6).padEnd(6, "0");
}

/** True when the query is a hex color (#RGB, #RRGGBB, or RRGGBB). */
export function isHexQuery(query: string): boolean {
  const q = query.trim();
  return (
    /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(q) ||
    /^[0-9a-fA-F]{6}$/.test(q)
  );
}

export function birdHasExactHex(bird: BirdSummary, hex: string): boolean {
  const target = normalizeHex(hex);
  const hexes = [
    ...bird.palette.map((c) => c.hex),
    ...(bird.colors?.map((c) => c.hex) ?? []),
  ];
  return hexes.some((h) => normalizeHex(h) === target);
}

/** Filter birds whose plumage includes the exact picked hex. */
export function filterBirdsByHex(
  birds: BirdSummary[],
  hex: string | null,
): BirdSummary[] {
  if (!hex) return birds;
  return birds.filter((bird) => birdHasExactHex(bird, hex));
}

function matchesToken(bird: BirdSummary, token: string): boolean {
  if (isHexQuery(token)) {
    return birdHasExactHex(bird, token);
  }

  const color = normalizeColorQuery(token);
  if (bird.name.toLowerCase().includes(token)) return true;
  if (bird.scientificName.toLowerCase().includes(token)) return true;
  return bird.colorFamilies.some(
    (family) =>
      family === color ||
      family.includes(color) ||
      color.includes(family) ||
      family.includes(token),
  );
}

/**
 * Filter birds by name, scientific name, or plumage color family.
 *
 * Multiple words combine (AND), so "green red yellow" finds birds wearing all
 * three, and "blue jay" finds blue birds named jay.
 */
export function filterBirds(
  birds: BirdSummary[],
  query: string,
): BirdSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return birds;

  const tokens = q.split(/[\s,+]+/).filter(Boolean);
  if (tokens.length === 0) return birds;

  return birds.filter((bird) =>
    tokens.every((token) => matchesToken(bird, token)),
  );
}
