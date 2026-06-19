/** Generic BirdNET silhouettes when no species photo exists (SHA-256 of image bytes). */
export const BIRDNET_PLACEHOLDER_HASHES = new Set([
  "3f7029cc9831fab64e8d580fb12119f96e9c3e2b823b875f47727ca63b05ce09",
  "802efb8a692de80aa870e7ea9010b95f3a7956bea9b11ad07fc2e5d72d9540b8",
  "4da37bd5d7c2f2b837c8b6107440fb4d5af47511f3085f0cf7f0776353ccfca7",
]);

/** Smallest real BirdNET photo in our catalog is ~4.5 KB; placeholders are ≤ 3 KB. */
export const BIRDNET_PLACEHOLDER_MAX_BYTES = 3000;

export function isBirdNetImageUrl(url: string): boolean {
  return url.includes("birdnet.cornell.edu/taxonomy/api/image");
}

export function isBirdNetPlaceholderHash(hashHex: string): boolean {
  return BIRDNET_PLACEHOLDER_HASHES.has(hashHex.toLowerCase());
}

export function isBirdNetPlaceholderBytes(
  byteLength: number,
  hashHex: string,
): boolean {
  if (isBirdNetPlaceholderHash(hashHex)) return true;
  return byteLength > 0 && byteLength <= 1646;
}
