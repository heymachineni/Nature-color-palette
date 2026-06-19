"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type HSV = { h: number; s: number; v: number };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function hsvToHex({ h, s, v }: HSV): string {
  const c = v * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = v - c;
  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

function hexToHsv(hex: string): HSV {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0");
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

const isHex = (s: string) => /^#?[0-9a-fA-F]{6}$/.test(s.trim());

/**
 * Compact, custom color picker — full design control, hex-only, anchored to its
 * trigger. Replaces the native <input type="color"> (whose popup position,
 * styling, and RGB readout can't be controlled).
 */
export function ColorPicker({
  value,
  onChange,
  onClose,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  className?: string;
}) {
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));
  const [hexText, setHexText] = useState(value.toUpperCase());
  const rootRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);

  const hex = hsvToHex(hsv);
  const hueHex = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  useEffect(() => {
    function onDocPointer(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (rootRef.current?.contains(target)) return;
      if (target.closest("[data-color-trigger]")) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function apply(next: HSV) {
    setHsv(next);
    const nextHex = hsvToHex(next);
    setHexText(nextHex);
    onChange(nextHex);
  }

  function onSvPointer(e: React.PointerEvent) {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = clamp01((e.clientX - rect.left) / rect.width);
    const v = 1 - clamp01((e.clientY - rect.top) / rect.height);
    apply({ ...hsv, s, v });
  }

  function onHuePointer(e: React.PointerEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const h = clamp01((e.clientX - rect.left) / rect.width) * 360;
    apply({ ...hsv, h });
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        "rounded-2xl border border-border bg-background p-3 shadow-xl shadow-black/10",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Pick a color
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close color picker"
          className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      <div
        ref={svRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onSvPointer(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) onSvPointer(e);
        }}
        className="relative h-36 w-full cursor-crosshair touch-none overflow-hidden rounded-xl ring-1 ring-inset ring-black/10"
        style={{
          backgroundImage: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueHex})`,
        }}
      >
        <span
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/25"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            backgroundColor: hex,
          }}
        />
      </div>

      <div
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onHuePointer(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) onHuePointer(e);
        }}
        className="relative mt-3 h-3.5 w-full cursor-pointer touch-none rounded-full ring-1 ring-inset ring-black/10"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
      >
        <span
          className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/25"
          style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: hueHex }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className="size-8 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
          style={{ backgroundColor: hex }}
        />
        <input
          value={hexText}
          onChange={(e) => {
            const raw = e.target.value;
            setHexText(raw.toUpperCase());
            if (isHex(raw)) {
              const norm = raw.startsWith("#") ? raw : `#${raw}`;
              setHsv(hexToHsv(norm));
              onChange(norm.toUpperCase());
            }
          }}
          spellCheck={false}
          aria-label="Hex color"
          className="h-9 w-full rounded-full border border-border bg-background px-3.5 font-mono text-sm uppercase text-foreground outline-none focus:border-foreground/30"
        />
      </div>
    </div>
  );
}
