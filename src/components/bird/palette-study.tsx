"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import type { PlumageColorData } from "@/types/bird";
import { bestTextOn } from "@/lib/color/accessibility";
import { cn } from "@/lib/utils";

function formatShare(share: number) {
  return share >= 1 ? Math.round(share) : Math.round(share * 10) / 10;
}

export function PaletteStudy({ colors }: { colors: PlumageColorData[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  if (colors.length === 0) return null;

  const sorted = [...colors].sort((a, b) => b.share - a.share);
  const total = sorted.reduce((sum, c) => sum + c.share, 0) || 1;

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      toast.success(message);
      window.setTimeout(
        () => setCopied((c) => (c === value ? null : c)),
        1200,
      );
    } catch {
      toast.error("Couldn't copy");
    }
  };


  const copyCss = () => {
    const lines = sorted.map((c, i) => {
      const name = c.family.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || `color-${i + 1}`;
      return `  --${name}: ${c.hex.toUpperCase()}; /* ${formatShare(c.share)}% */`;
    });
    const css = `:root {\n${lines.join("\n")}\n}`;
    copy(css, "Copied as CSS variables");
  };

  return (
    <section className="mt-10 sm:mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl tracking-tight text-foreground sm:text-2xl">
            Palette
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {colors.length} colors · tap any to copy hex
          </p>
        </div>
        <button
          type="button"
          onClick={copyCss}
          className="shrink-0 rounded-full border border-border bg-background px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Copy CSS
        </button>
      </div>

      {/* Proportional combination — the overall feel of the bird.
          Min 12px per color; on small screens it overflows and can be dragged. */}
      <div
        className="no-scrollbar flex h-14 w-full cursor-grab overflow-x-auto overscroll-x-contain rounded-2xl ring-1 ring-inset ring-black/[0.06] active:cursor-grabbing sm:h-16"
        role="group"
        aria-label="Plumage color proportions"
        onMouseLeave={() => setHovered(null)}
      >
        {sorted.map((c, i) => {
          const isActive = hovered === i;
          const dimmed = hovered !== null && !isActive;
          return (
            <button
              key={`bar-${c.hex}-${i}`}
              type="button"
              onMouseEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              onClick={() => copy(c.hex, `Copied ${c.hex.toUpperCase()}`)}
              title={`Copy ${c.hex.toUpperCase()} · ${formatShare(c.share)}%`}
              aria-label={`${c.family}, ${c.hex.toUpperCase()}, ${formatShare(c.share)} percent`}
              className="relative flex items-end justify-center overflow-hidden outline-none transition-[flex-grow,opacity] duration-300 ease-out"
              style={{
                flexGrow: isActive ? c.share + total * 0.6 : c.share,
                flexBasis: 0,
                minWidth: "12px",
                opacity: dimmed ? 0.22 : 1,
                backgroundColor: c.hex,
              }}
            >
              <span
                className={cn(
                  "mb-2.5 font-mono text-[10px] uppercase tracking-wide transition-opacity duration-200",
                  isActive ? "opacity-100" : "opacity-0",
                )}
                style={{ color: bestTextOn(c.hex) }}
              >
                {c.hex}
              </span>
            </button>
          );
        })}
      </div>

      {/* Each color, named and copyable. */}
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((c, i) => {
          const isCopied = copied === c.hex;
          return (
            <li key={`row-${c.hex}-${i}`}>
              <button
                type="button"
                onClick={() => copy(c.hex, `Copied ${c.hex.toUpperCase()}`)}
                className="group flex w-full items-center gap-3 rounded-xl bg-muted/60 p-2.5 text-left transition-colors hover:bg-muted"
              >
                <span
                  className="size-10 shrink-0 rounded-lg ring-1 ring-inset ring-black/[0.06]"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium capitalize text-foreground">
                    {c.family}
                  </span>
                  <span className="font-mono text-xs uppercase text-muted-foreground">
                    {c.hex}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1.5 self-stretch pr-0.5">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {formatShare(c.share)}%
                  </span>
                  {isCopied ? (
                    <Check className="size-3.5 text-foreground" />
                  ) : (
                    <Copy
                      className={cn(
                        "size-3.5 text-muted-foreground/50 opacity-0 transition-opacity",
                        "group-hover:opacity-100",
                      )}
                    />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
