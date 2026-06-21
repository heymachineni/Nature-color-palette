import { isSameOriginSampleUrl } from "./sample-url";

function probeCanvas(img: HTMLImageElement): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  try {
    ctx.drawImage(img, 0, 0, 2, 2);
    ctx.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
}

function loadImageElement(
  url: string,
  crossOrigin: boolean,
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(probeCanvas(img) ? img : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function isLikelyImageBlob(blob: Blob): boolean {
  if (blob.size < 32) return false;
  if (blob.type.startsWith("image/")) return true;
  return blob.type === "" || blob.type === "application/octet-stream";
}

/** Fetch → blob URL avoids CORS canvas taint for same-origin and proxy routes. */
async function loadImageViaFetch(url: string): Promise<HTMLImageElement | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    if (!isLikelyImageBlob(blob)) return null;

    const objUrl = URL.createObjectURL(blob);
    try {
      return await loadImageElement(objUrl, false);
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  } catch {
    return null;
  }
}

/** Load an image probe that supports canvas pixel reads. */
export async function loadSampleProbe(url: string): Promise<HTMLImageElement | null> {
  const useFetch =
    url.startsWith("/") ||
    url.startsWith("/api/") ||
    (typeof window !== "undefined" && url.startsWith(window.location.origin));

  if (useFetch) {
    const fetched = await loadImageViaFetch(url);
    if (fetched) return fetched;
  }

  const crossOrigin = !isSameOriginSampleUrl(url);
  return loadImageElement(url, crossOrigin);
}

const RETRY_DELAYS_MS = [0, 800, 2000, 4000];

/** Retry probe loads — covers slow dev proxy compile and cold Cloud Functions. */
export async function loadSampleProbeWithRetry(
  urls: string[],
): Promise<HTMLImageElement | null> {
  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    for (const url of urls) {
      const img = await loadSampleProbe(url);
      if (img) return img;
    }
  }
  return null;
}
