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

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}
