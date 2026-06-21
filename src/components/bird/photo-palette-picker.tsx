"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toastCopiedHex, toastError } from "@/lib/copy-color-toast";
import { objectCoverPixelAt, rgbToHex } from "@/lib/color/match-palette";
import { paletteHaptic } from "@/lib/haptics";
import {
  loadSampleProbeWithRetry,
} from "@/lib/photos/load-sample-image";
import { sampleProbeUrls } from "@/lib/photos/sample-url";
import { cn } from "@/lib/utils";

const MAX_SAMPLE_EDGE = 640;
const HOLD_MS = 280;

/** Hover pill layout — all spacing in px for predictable positioning. */
const HOVER_PILL = {
  padX: 8,
  gap: 6,
  swatch: 12,
  fontSize: 10,
  offsetX: 10,
  offsetY: 10,
  edge: 8,
  height: 24,
} as const;

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

function isHoverPointer(type: string) {
  return type === "mouse" || type === "pen";
}

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
  const [sampleState, setSampleState] = useState<
    "loading" | "ready" | "failed"
  >("loading");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [coarsePointer, setCoarsePointer] = useState(false);

  const canPick = sampleState === "ready";

  useEffect(() => {
    setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPreview(null);
    setLoaded(false);
    setSampleState("loading");
    sampleImgRef.current = null;
    sampleCanvasRef.current = null;

    void loadSampleProbeWithRetry(sampleProbeUrls(src)).then((img) => {
      if (cancelled) return;
      if (img) {
        sampleImgRef.current = img;
        setSampleState("ready");
      } else {
        setSampleState("failed");
      }
    });

    return () => {
      cancelled = true;
    };
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
      toastCopiedHex(hex);
      paletteHaptic("copy");
    } catch {
      toastError("Couldn't copy");
    }
  }, []);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const onHoverPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPick || !isHoverPointer(e.pointerType)) return;
    updatePreview(e.clientX, e.clientY);
  };

  const onPointerLeave = () => {
    clearHoldTimer();
    touchHoldingRef.current = false;
    setPreview(null);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPick || isHoverPointer(e.pointerType)) return;
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
    if (!canPick || isHoverPointer(e.pointerType)) return;
    if (!touchHoldingRef.current) return;
    updatePreview(e.clientX, e.clientY);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isHoverPointer(e.pointerType)) return;

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

  const pillLeft = preview
    ? Math.min(
        Math.max(
          HOVER_PILL.edge,
          preview.x + HOVER_PILL.offsetX,
        ),
        (containerRef.current?.clientWidth ?? 0) -
          HOVER_PILL.edge -
          120,
      )
    : 0;

  const pillTop = preview
    ? Math.max(
        HOVER_PILL.edge,
        preview.y - HOVER_PILL.offsetY - HOVER_PILL.height,
      )
    : 0;

  return (
    <div className={cn("rounded-2xl bg-muted/70 p-2", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden rounded-xl",
          canPick && "cursor-crosshair touch-none",
        )}
        aria-label={
          canPick
            ? coarsePointer
              ? "Bird photo — hold for color codes, release to copy"
              : "Bird photo — hover for color codes, click to copy"
            : alt
        }
        onPointerMove={(e) => {
          onHoverPointerMove(e);
          onTouchPointerMove(e);
        }}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
      >
        {!loaded && (
          <div aria-hidden className="absolute inset-0 z-[1] bg-muted shimmer" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          referrerPolicy="no-referrer"
          draggable={false}
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />

        {preview && (
          <div
            className="pointer-events-none absolute z-10 flex items-center rounded-full border border-border/80 bg-background/95 font-mono uppercase tracking-wide text-foreground shadow-md backdrop-blur"
            style={{
              left: pillLeft,
              top: pillTop,
              height: HOVER_PILL.height,
              paddingLeft: HOVER_PILL.padX,
              paddingRight: HOVER_PILL.padX,
              gap: HOVER_PILL.gap,
              fontSize: HOVER_PILL.fontSize,
            }}
          >
            <span
              className="shrink-0 rounded-full ring-1 ring-inset ring-black/10"
              style={{
                width: HOVER_PILL.swatch,
                height: HOVER_PILL.swatch,
                backgroundColor: preview.hex,
              }}
              aria-hidden
            />
            {preview.hex}
          </div>
        )}
      </div>

      {sampleState === "ready" ? (
        <p className="mt-2 px-1 text-[11px] leading-snug text-muted-foreground">
          {coarsePointer
            ? "Hold on the image for color codes"
            : "Hover on the image for color codes"}
        </p>
      ) : sampleState === "loading" ? (
        <p className="mt-2 px-1 text-[11px] leading-snug text-muted-foreground">
          Preparing color sampling…
        </p>
      ) : null}
    </div>
  );
}
