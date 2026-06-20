const ALLOWED_SAMPLE_HOSTS = new Set([
  "birdnet.cornell.edu",
  "cdn.download.ams.birds.cornell.edu",
  "inaturalist-open-data.s3.amazonaws.com",
  "static.inaturalist.org",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
]);

/** Same-origin proxy so canvas can read pixels from remote bird photos. */
export function sampleImageUrl(src: string): string {
  if (typeof window === "undefined") return src;
  if (src.startsWith("/") || src.startsWith(window.location.origin)) return src;

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return src;
  }

  if (parsed.protocol !== "https:" || !ALLOWED_SAMPLE_HOSTS.has(parsed.hostname)) {
    return src;
  }

  return `/api/photo-sample?url=${encodeURIComponent(src)}`;
}
