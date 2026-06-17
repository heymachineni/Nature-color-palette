import type { BirdSummary } from "@/types/bird";
import { normalizeColorQuery } from "@/lib/color/naming";

/**
 * Filter birds by name, scientific name, or plumage color family.
 */
export function filterBirds(
  birds: BirdSummary[],
  query: string,
): BirdSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return birds;
  const color = normalizeColorQuery(q);

  return birds.filter((bird) => {
    if (bird.name.toLowerCase().includes(q)) return true;
    if (bird.scientificName.toLowerCase().includes(q)) return true;
    return bird.colorFamilies.some(
      (family) =>
        family.includes(color) ||
        color.includes(family) ||
        family.includes(q),
    );
  });
}

export function filterBirdsByColorFamily(
  birds: BirdSummary[],
  family: string | null,
): BirdSummary[] {
  if (!family) return birds;
  const c = normalizeColorQuery(family);
  return birds.filter((bird) =>
    bird.colorFamilies.some(
      (f) => f === c || f.includes(c) || c.includes(f),
    ),
  );
}
