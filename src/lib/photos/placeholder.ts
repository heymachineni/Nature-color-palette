/** True when there is no real photo to show (empty or generic placeholder asset). */
export function isBirdPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  return url.includes("bird-placeholder");
}

export function hasBirdImage(url: string | null | undefined): boolean {
  return !isBirdPlaceholderUrl(url);
}

/** Drop birds without a real photo; prune similar links to removed slugs. */
export function filterBirdsWithPhotos<
  T extends { slug: string; imageUrl: string; similar?: { slug: string }[] },
>(birds: T[]): T[] {
  const kept = birds.filter((b) => hasBirdImage(b.imageUrl));
  const slugs = new Set(kept.map((b) => b.slug));
  return kept.map((b) => ({
    ...b,
    similar: b.similar?.filter((s) => slugs.has(s.slug)) ?? [],
  }));
}
