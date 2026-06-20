/**
 * Curated iNaturalist photos when BirdNET serves a placeholder or poor image.
 */
export const IMAGE_OVERRIDES: Record<string, string> = {
  "pavo-cristatus":
    "https://inaturalist-open-data.s3.amazonaws.com/photos/165318600/medium.jpg",
  "cardinalis-cardinalis":
    "https://inaturalist-open-data.s3.amazonaws.com/photos/189434971/medium.jpg",
  "nesillas-aldabrana": "/birds/nesillas-aldabrana.png",
};

export function resolveImageUrl(slug: string, imageUrl: string): string {
  return IMAGE_OVERRIDES[slug] ?? imageUrl;
}
