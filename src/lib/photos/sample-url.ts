import { isPhotoSampleHost } from "./photo-sample-hosts";

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

  if (parsed.protocol !== "https:" || !isPhotoSampleHost(parsed.hostname)) {
    return src;
  }

  return `/api/photo-sample?url=${encodeURIComponent(src)}`;
}

/** True when the URL can be drawn to canvas without a proxy. */
export function isSameOriginSampleUrl(sampleSrc: string): boolean {
  if (sampleSrc.startsWith("/api/")) return false;
  if (sampleSrc.startsWith("/")) return true;
  if (typeof window !== "undefined" && sampleSrc.startsWith(window.location.origin)) {
    return true;
  }
  return false;
}

/** URLs to try when loading a canvas sampling probe (proxy first for remote). */
export function sampleProbeUrls(src: string): string[] {
  const proxied = sampleImageUrl(src);
  if (proxied === src) return [src];
  return [proxied, src];
}
