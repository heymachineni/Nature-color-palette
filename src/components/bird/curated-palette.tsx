"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { CuratedPaletteData } from "@/types/bird";
import { cn } from "@/lib/utils";

const ROLES = [
  { key: "hero" as const, pct: null, label: "Signature" },
  { key: "support" as const, pct: null, label: "Body" },
  { key: "accent" as const, pct: null, label: "Accent" },
  { key: "neutral" as const, pct: null, label: "Neutral" },
] as const;

async function copyHex(hex: string) {
  try {
    await navigator.clipboard.writeText(hex);
    toast.success(`Copied ${hex.toUpperCase()}`);
  } catch {
    toast.error("Couldn't copy");
  }
}

export function CuratedPalette({
  curated,
}: {
  curated: CuratedPaletteData;
}) {
  return (
    <div className="space-y-4">
      <div className="flex h-14 overflow-hidden rounded-xl ring-1 ring-inset ring-black/[0.06] sm:h-16">
        {ROLES.slice(0, 3).map(({ key }) => {
          const c = curated[key];
          const flex =
            key === "support" ? 55 : key === "hero" ? 30 : 15;
          return (
            <button
              key={key}
              type="button"
              onClick={() => copyHex(c.uiHex)}
              title={`Copy ${c.uiHex}`}
              className="relative transition-opacity hover:opacity-90"
              style={{
                flexBasis: `${flex}%`,
                backgroundColor: c.uiHex,
              }}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {ROLES.map(({ key, label }) => {
          const c = curated[key];
          const displayLabel = c.label || label;
          return (
            <button
              key={key}
              type="button"
              onClick={() => copyHex(c.uiHex)}
              className="group flex items-center gap-2.5 rounded-lg border border-border/70 bg-card px-2.5 py-2 text-left transition-colors hover:border-border sm:px-3 sm:py-2.5"
            >
              <span
                className="size-8 shrink-0 rounded-md ring-1 ring-inset ring-black/[0.06]"
                style={{ backgroundColor: c.uiHex }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-foreground">
                    {displayLabel}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-1 font-mono text-[11px] uppercase text-foreground">
                  {c.uiHex}
                  <Copy className="size-2.5 opacity-0 transition-opacity group-hover:opacity-50" />
                </span>
                <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                  {c.natureHex}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StudioPanel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {meta && (
          <span className="text-xs text-muted-foreground">{meta}</span>
        )}
      </div>
      {children}
    </section>
  );
}
