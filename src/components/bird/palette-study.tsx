"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import type { PlumageColorData } from "@/types/bird";
import { bestTextOn } from "@/lib/color/accessibility";
import { paletteHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PaletteView = "swatch" | "list";

function PaletteSwatchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M20 14H6c-2.2 0-4 1.8-4 4s1.8 4 4 4h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2M6 20c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2m.3-8L13 5.3c.8-.8 2-.8 2.8 0l2.8 2.8c.8.8.8 2 0 2.8l-.9 1.1zM2 13.5V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v1.5z" />
    </svg>
  );
}

function PaletteListIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M3.9 10.72H20v3.31H3.9zm0-4.28H20v3.31H3.9zM17.5 2h-11C5.06 2 3.9 3.18 3.9 4.65v.85H20v-.85C20 3.18 18.88 2 17.5 2M3.9 15v.84c0 1.47 1.16 2.66 2.6 2.66h6.87V22l3.4-3.5h.73c1.44 0 2.61-1.19 2.61-2.66V15z" />
    </svg>
  );
}

function formatShare(share: number) {
  return share >= 1 ? Math.round(share) : Math.round(share * 10) / 10;
}

type DragState = {
  pointerId: number;
  startX: number;
  startScroll: number;
  moved: boolean;
  lastIndex: number | null;
};

export function PaletteStudy({
  colors,
  activeHexes = null,
}: {
  colors: PlumageColorData[];
  activeHexes?: Set<string> | null;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState<PaletteView>("swatch");
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const photoPickActive = activeHexes != null && activeHexes.size > 0;

  useEffect(() => {
    if (!photoPickActive || view !== "list") return;
    const root = listRef.current;
    if (!root) return;
    const first = root.querySelector<HTMLElement>("[data-palette-active='true']");
    first?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeHexes, photoPickActive, view]);

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

  const swatchIndexAt = (clientX: number): number | null => {
    const root = scrollRef.current;
    if (!root) return null;
    const segments = root.querySelectorAll<HTMLElement>("[data-swatch]");
    for (let i = 0; i < segments.length; i++) {
      const rect = segments[i].getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return i;
    }
    return null;
  };

  const highlightSwatch = (index: number | null, withHaptic = false) => {
    if (photoPickActive) return;
    setHovered((prev) => {
      if (withHaptic && index !== null && prev !== index) paletteHaptic("tick");
      return index;
    });
  };

  const isSwatchActive = (c: PlumageColorData, index: number) => {
    if (photoPickActive) return activeHexes!.has(c.hex);
    return hovered === index;
  };

  const isSwatchDimmed = (c: PlumageColorData, index: number) => {
    if (photoPickActive) return !activeHexes!.has(c.hex);
    return hovered !== null && hovered !== index;
  };

  const isListDimmed = (c: PlumageColorData) =>
    photoPickActive && !activeHexes!.has(c.hex);

  const onBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: scrollRef.current.scrollLeft,
      moved: false,
      lastIndex: swatchIndexAt(e.clientX),
    };
    scrollRef.current.setPointerCapture(e.pointerId);
    highlightSwatch(dragRef.current.lastIndex);
  };

  const onBarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !scrollRef.current) return;

    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 4) {
      if (!drag.moved) {
        drag.moved = true;
        setDragging(true);
      }
      scrollRef.current.scrollLeft = drag.startScroll - dx;
    }

    const index = swatchIndexAt(e.clientX);
    if (index !== null && index !== drag.lastIndex) {
      drag.lastIndex = index;
      highlightSwatch(index, true);
    } else if (index !== null) {
      highlightSwatch(index);
    }
  };

  const endBarDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    scrollRef.current?.releasePointerCapture(e.pointerId);

    if (!drag.moved) {
      const index = swatchIndexAt(e.clientX);
      if (index !== null) {
        copy(sorted[index].hex, `Copied ${sorted[index].hex.toUpperCase()}`);
        paletteHaptic("copy");
      }
    }

    dragRef.current = null;
    setDragging(false);
  };

  const viewOptions: {
    id: PaletteView;
    label: string;
    Icon: typeof PaletteSwatchIcon;
  }[] = [
    { id: "swatch", label: "Swatch", Icon: PaletteSwatchIcon },
    { id: "list", label: "List", Icon: PaletteListIcon },
  ];

  return (
    <section className="mt-10 sm:mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl tracking-tight text-foreground sm:text-2xl">
            Palette
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {colors.length} colors
          </p>
        </div>

        <TooltipProvider delayDuration={300}>
          <div
            className="flex items-center rounded-full border border-border bg-background p-0.5"
            role="group"
            aria-label="Palette view"
          >
            {viewOptions.map(({ id, label, Icon }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setView(id)}
                    aria-label={label}
                    aria-pressed={view === id}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full transition-colors",
                      view === id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[100]">
                  {label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {view === "swatch" ? (
        <div
          ref={scrollRef}
          className={cn(
            "no-scrollbar flex h-14 w-full select-none overflow-x-auto overscroll-x-contain rounded-2xl ring-1 ring-inset ring-black/[0.06] sm:h-16",
            "touch-none cursor-grab active:cursor-grabbing",
            dragging && "cursor-grabbing",
          )}
          role="group"
          aria-label="Plumage color proportions"
          onPointerDown={onBarPointerDown}
          onPointerMove={onBarPointerMove}
          onPointerUp={endBarDrag}
          onPointerCancel={endBarDrag}
          onMouseLeave={() => {
            if (!dragRef.current && !photoPickActive) setHovered(null);
          }}
        >
          {sorted.map((c, i) => {
            const isActive = isSwatchActive(c, i);
            const dimmed = isSwatchDimmed(c, i);
            return (
              <div
                key={`bar-${c.hex}-${i}`}
                data-swatch
                role="button"
                tabIndex={0}
                onMouseEnter={() => {
                  if (!dragRef.current) highlightSwatch(i);
                }}
                onFocus={() => highlightSwatch(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    copy(c.hex, `Copied ${c.hex.toUpperCase()}`);
                    paletteHaptic("copy");
                  }
                }}
                title={`${c.hex.toUpperCase()} · ${formatShare(c.share)}%`}
                aria-label={`${c.family}, ${c.hex.toUpperCase()}, ${formatShare(c.share)} percent`}
                className="relative flex shrink-0 items-end justify-center overflow-hidden outline-none transition-[flex-grow,opacity] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/40"
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
                    "pointer-events-none mb-2.5 font-mono text-[10px] uppercase tracking-wide transition-opacity duration-200",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                  style={{ color: bestTextOn(c.hex) }}
                >
                  {c.hex}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <ul
          ref={listRef}
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
        >
          {sorted.map((c, i) => {
            const isCopied = copied === c.hex;
            const isActive = photoPickActive && activeHexes!.has(c.hex);
            const dimmed = isListDimmed(c);
            return (
              <li
                key={`row-${c.hex}-${i}`}
                data-palette-active={isActive ? "true" : undefined}
              >
                <button
                  type="button"
                  onClick={() => copy(c.hex, `Copied ${c.hex.toUpperCase()}`)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl bg-muted/60 p-2.5 text-left transition-all",
                    dimmed ? "opacity-[0.22]" : "opacity-100",
                    isActive && "ring-2 ring-foreground/25",
                    !dimmed && "hover:bg-muted",
                  )}
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
      )}
    </section>
  );
}
