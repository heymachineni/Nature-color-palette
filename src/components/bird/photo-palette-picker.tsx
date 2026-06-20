"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { X } from "lucide-react";
import type { PlumageColorData } from "@/types/bird";
import {
  matchPaletteFromPixel,
  objectCoverPixelAt,
  REGION_HIGHLIGHT_DELTA,
  rgbToHex,
} from "@/lib/color/match-palette";
import { colorDistance } from "@/lib/color/extract";
import { paletteHaptic } from "@/lib/haptics";
import { sampleImageUrl } from "@/lib/photos/sample-url";
import { cn } from "@/lib/utils";

const MAX_SAMPLE_EDGE = 640;

type PhotoPalettePickerProps = {
  src: string;
  alt: string;
  colors: PlumageColorData[];
  activeHexes: Set<string> | null;
  onActiveHexesChange: (hexes: Set<string> | null) => void;
  className?: string;
  priority?: boolean;
};

export function PhotoPalettePicker({
  src,
  alt,
  colors,
  activeHexes,
  onActiveHexesChange,
  className,
  priority = false,
}: PhotoPalettePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const sampleImgRef = useRef<HTMLImageElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [canPick, setCanPick] = useState(false);
  const paintingRef = useRef(false);

  const clearSelection = useCallback(() => {
    onActiveHexesChange(null);
    const canvas = overlayRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [onActiveHexesChange]);

  useEffect(() => {
    clearSelection();
    setLoaded(false);
    setCanPick(false);
    sampleImgRef.current = null;

    const probe = new Image();
    probe.crossOrigin = "anonymous";
    probe.referrerPolicy = "no-referrer";

    probe.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      try {
        ctx.drawImage(probe, 0, 0, 2, 2);
        ctx.getImageData(0, 0, 1, 1);
        sampleImgRef.current = probe;
        setCanPick(true);
      } catch {
        setCanPick(false);
      }
    };

    probe.onerror = () => setCanPick(false);
    probe.src = sampleImageUrl(src);
  }, [src, clearSelection]);

  const ensureSampleCanvas = useCallback((): CanvasRenderingContext2D | null => {
    const img = sampleImgRef.current;
    if (!img?.naturalWidth) return null;

    let canvas = sampleCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      sampleCanvasRef.current = canvas;
    }

    const scale = Math.min(
      1,
      MAX_SAMPLE_EDGE / Math.max(img.naturalWidth, img.naturalHeight),
    );
    canvas.width = Math.max(1, Math.floor(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.floor(img.naturalHeight * scale));

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return ctx;
    } catch {
      return null;
    }
  }, []);

  const readPixelHex = useCallback(
    (imageX: number, imageY: number): string | null => {
      const ctx = ensureSampleCanvas();
      const img = sampleImgRef.current;
      if (!ctx || !img?.naturalWidth) return null;

      const scaleX = ctx.canvas.width / img.naturalWidth;
      const scaleY = ctx.canvas.height / img.naturalHeight;
      const sx = Math.min(ctx.canvas.width - 1, Math.floor(imageX * scaleX));
      const sy = Math.min(ctx.canvas.height - 1, Math.floor(imageY * scaleY));

      try {
        const [r, g, b, a] = ctx.getImageData(sx, sy, 1, 1).data;
        if (a < 32) return null;
        return rgbToHex(r, g, b);
      } catch {
        return null;
      }
    },
    [ensureSampleCanvas],
  );

  const paintOverlay = useCallback(
    (regionHex: string, reset: boolean) => {
      const container = containerRef.current;
      const canvas = overlayRef.current;
      const img = sampleImgRef.current;
      const ctxSample = ensureSampleCanvas();
      if (!container || !canvas || !img?.naturalWidth || !ctxSample) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reset) ctx.clearRect(0, 0, rect.width, rect.height);

      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const imageAspect = nw / nh;
      const boxAspect = rect.width / rect.height;

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

      const step = Math.max(2, Math.floor(Math.min(rect.width, rect.height) / 80));
      const sample = ctxSample;
      const scaleX = sample.canvas.width / nw;
      const scaleY = sample.canvas.height / nh;

      for (let py = 0; py < rect.height; py += step) {
        for (let px = 0; px < rect.width; px += step) {
          const relX = px / rect.width;
          const relY = py / rect.height;
          const ix = sx + relX * sw;
          const iy = sy + relY * sh;

          const sxp = Math.min(
            sample.canvas.width - 1,
            Math.floor(ix * scaleX),
          );
          const syp = Math.min(
            sample.canvas.height - 1,
            Math.floor(iy * scaleY),
          );

          let r: number;
          let g: number;
          let b: number;
          let a: number;
          try {
            [r, g, b, a] = sample.getImageData(sxp, syp, 1, 1).data;
          } catch {
            continue;
          }
          if (a < 40) continue;

          const hex = rgbToHex(r, g, b);
          if (colorDistance(hex, regionHex) > REGION_HIGHLIGHT_DELTA) continue;

          ctx.fillStyle = `${hex}66`;
          ctx.fillRect(px, py, step, step);
        }
      }
    },
    [ensureSampleCanvas],
  );

  const applyPick = useCallback(
    (clientX: number, clientY: number, merge: boolean) => {
      if (!canPick) return;

      const container = containerRef.current;
      const img = sampleImgRef.current;
      if (!container || !img?.naturalWidth) return;

      const box = container.getBoundingClientRect();
      const pixel = objectCoverPixelAt(img, clientX, clientY, box);
      if (!pixel) return;

      const hex = readPixelHex(pixel.x, pixel.y);
      if (!hex) return;

      const matched = matchPaletteFromPixel(hex, colors);
      if (matched.size === 0) return;

      const swatchHex = [...matched][0]!;
      const next =
        merge && activeHexes
          ? new Set([...activeHexes, swatchHex])
          : matched;

      onActiveHexesChange(next);
      paintOverlay(swatchHex, !merge);
      paletteHaptic("tick");
    },
    [
      activeHexes,
      canPick,
      colors,
      onActiveHexesChange,
      paintOverlay,
      readPixelHex,
    ],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPick) return;
    paintingRef.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
    applyPick(e.clientX, e.clientY, false);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!paintingRef.current || !canPick) return;
    applyPick(e.clientX, e.clientY, true);
  };

  const endPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!paintingRef.current) return;
    paintingRef.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className={cn("rounded-2xl bg-muted/70 p-2", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden rounded-xl",
          canPick && "cursor-crosshair touch-none",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onKeyDown={(e) => {
          if (e.key === "Escape") clearSelection();
        }}
      >
        {!loaded && (
          <div aria-hidden className="absolute inset-0 bg-muted shimmer" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          referrerPolicy="no-referrer"
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        />
      </div>

      {activeHexes && activeHexes.size > 0 ? (
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <p className="text-[11px] leading-snug text-muted-foreground">
            {activeHexes.size === 1
              ? "Showing the closest palette match to your selection."
              : `${activeHexes.size} palette colors selected — drag to add more.`}
          </p>
          <button
            type="button"
            onClick={clearSelection}
            className="flex shrink-0 items-center gap-1 rounded-full border border-border/80 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            Show all
            <X className="size-3" />
          </button>
        </div>
      ) : canPick ? (
        <p className="mt-2 px-1 text-[11px] leading-snug text-muted-foreground">
          Tap or drag on the photo to highlight a palette color.
        </p>
      ) : null}
    </div>
  );
}
