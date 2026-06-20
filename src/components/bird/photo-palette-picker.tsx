"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toast } from "sonner";
import {
  objectCoverPixelAt,
  rgbToHex,
} from "@/lib/color/match-palette";
import { paletteHaptic } from "@/lib/haptics";
import { isSameOriginSampleUrl, sampleImageUrl } from "@/lib/photos/sample-url";
import { cn } from "@/lib/utils";

const MAX_SAMPLE_EDGE = 640;
const HOLD_MS = 280;

type Preview = {
  hex: string;
  x: number;
  y: number;
};

type PhotoPalettePickerProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function PhotoPalettePicker({
  src,
  alt,
  className,
  priority = false,
}: PhotoPalettePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sampleImgRef = useRef<HTMLImageElement | null>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchHoldingRef = useRef(false);

  const [loaded, setLoaded] = useState(false);
  const [canPick, setCanPick] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    setPreview(null);
    setLoaded(false);
    setCanPick(false);
    sampleImgRef.current = null;

    const sampleSrc = sampleImageUrl(src);
    const probe = new Image();
    if (!isSameOriginSampleUrl(sampleSrc)) {
      probe.crossOrigin = "anonymous";
    }
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
    probe.src = sampleSrc;
  }, [src]);

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

  const sampleAt = useCallback(
    (clientX: number, clientY: number): string | null => {
      const container = containerRef.current;
      const img = sampleImgRef.current;
      if (!container || !img?.naturalWidth || !canPick) return null;

      const box = container.getBoundingClientRect();
      const pixel = objectCoverPixelAt(img, clientX, clientY, box);
      if (!pixel) return null;

      const ctx = ensureSampleCanvas();
      if (!ctx) return null;

      const scaleX = ctx.canvas.width / img.naturalWidth;
      const scaleY = ctx.canvas.height / img.naturalHeight;
      const sx = Math.min(ctx.canvas.width - 1, Math.floor(pixel.x * scaleX));
      const sy = Math.min(ctx.canvas.height - 1, Math.floor(pixel.y * scaleY));

      try {
        const [r, g, b, a] = ctx.getImageData(sx, sy, 1, 1).data;
        if (a < 32) return null;
        return rgbToHex(r, g, b);
      } catch {
        return null;
      }
    },
    [canPick, ensureSampleCanvas],
  );

  const updatePreview = useCallback(
    (clientX: number, clientY: number) => {
      const hex = sampleAt(clientX, clientY);
      if (!hex) {
        setPreview(null);
        return;
      }

      const container = containerRef.current;
      if (!container) return;
      const box = container.getBoundingClientRect();
      setPreview({
        hex,
        x: clientX - box.left,
        y: clientY - box.top,
      });
    },
    [sampleAt],
  );

  const copyHex = useCallback(async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      toast.success(`Copied ${hex}`);
      paletteHaptic("copy");
    } catch {
      toast.error("Couldn't copy");
    }
  }, []);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPick || e.pointerType !== "mouse") return;
    updatePreview(e.clientX, e.clientY);
  };

  const onPointerLeave = () => {
    clearHoldTimer();
    touchHoldingRef.current = false;
    if (!coarsePointer) setPreview(null);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPick || e.pointerType === "mouse") return;
    clearHoldTimer();
    touchHoldingRef.current = false;
    containerRef.current?.setPointerCapture(e.pointerId);
    holdTimerRef.current = setTimeout(() => {
      touchHoldingRef.current = true;
      updatePreview(e.clientX, e.clientY);
      paletteHaptic("tick");
    }, HOLD_MS);
  };

  const onTouchPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPick || e.pointerType === "mouse") return;
    if (!touchHoldingRef.current) return;
    updatePreview(e.clientX, e.clientY);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;

    clearHoldTimer();
    containerRef.current?.releasePointerCapture(e.pointerId);

    const hex = sampleAt(e.clientX, e.clientY);
    if (hex && touchHoldingRef.current) {
      void copyHex(hex);
    }

    touchHoldingRef.current = false;
    setPreview(null);
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canPick || coarsePointer) return;
    const hex = sampleAt(e.clientX, e.clientY);
    if (hex) void copyHex(hex);
  };

  return (
    <div className={cn("rounded-2xl bg-muted/70 p-2", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden rounded-xl",
          canPick && "cursor-crosshair touch-none",
        )}
        onPointerMove={(e) => {
          onPointerMove(e);
          onTouchPointerMove(e);
        }}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
      >
        {!loaded && (
          <div aria-hidden className="absolute inset-0 bg-muted shimmer" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
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

        {preview && (
          <div
            className="pointer-events-none absolute z-10 flex items-center gap-2 rounded-full border border-border/80 bg-background/95 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide text-foreground shadow-md backdrop-blur"
            style={{
              left: Math.max(8, Math.min(preview.x + 12, (containerRef.current?.clientWidth ?? 0) - 100)),
              top: Math.max(8, Math.min(preview.y - 36, (containerRef.current?.clientHeight ?? 0) - 40)),
            }}
          >
            <span
              className="size-3.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: preview.hex }}
              aria-hidden
            />
            {preview.hex}
          </div>
        )}
      </div>

      {canPick ? (
        <p className="mt-2 px-1 text-[11px] leading-snug text-muted-foreground">
          {coarsePointer
            ? "Hold to preview · release to copy"
            : "Hover for hex · click to copy"}
        </p>
      ) : null}
    </div>
  );
}
