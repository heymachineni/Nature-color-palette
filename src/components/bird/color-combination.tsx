"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { PlumageColorData } from "@/types/bird";
import { cn } from "@/lib/utils";

async function copyHex(hex: string) {
  try {
    await navigator.clipboard.writeText(hex);
    toast.success(`Copied ${hex.toUpperCase()}`);
  } catch {
    toast.error("Couldn't copy");
  }
}

export function ColorCombination({
  colors,
  className,
}: {
  colors: PlumageColorData[];
  className?: string;
}) {
  if (colors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No plumage colors extracted.</p>
    );
  }

  const totalShare = colors.reduce((s, c) => s + c.share, 0) || 1;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex h-16 overflow-hidden rounded-xl ring-1 ring-inset ring-black/[0.06] sm:h-[4.5rem]">
        {colors.map((c) => (
          <button
            key={c.hex + c.family}
            type="button"
            onClick={() => copyHex(c.hex)}
            title={`Copy ${c.hex}`}
            className="relative transition-opacity hover:opacity-90"
            style={{
              flex: Math.max(c.share, 8),
              backgroundColor: c.hex,
            }}
          />
        ))}
      </div>

      <div
        className={cn(
          "grid gap-2",
          colors.length <= 3
            ? "grid-cols-1 sm:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-4",
        )}
      >
        {colors.map((c) => {
          const pct =
            totalShare > 0
              ? Math.round((c.share / totalShare) * 100)
              : c.share;
          return (
            <button
              key={c.hex + c.family}
              type="button"
              onClick={() => copyHex(c.hex)}
              className="group flex items-center gap-2.5 rounded-lg border border-border/70 bg-card px-3 py-2.5 text-left transition-colors hover:border-border"
            >
              <span
                className="size-9 shrink-0 rounded-md ring-1 ring-inset ring-black/[0.06]"
                style={{ backgroundColor: c.hex }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium capitalize text-foreground">
                  {c.family}
                </span>
                <span className="mt-0.5 flex items-center gap-1 font-mono text-[11px] uppercase text-foreground">
                  {c.hex}
                  <Copy className="size-2.5 opacity-0 transition-opacity group-hover:opacity-50" />
                </span>
                <span className="text-[10px] text-muted-foreground">{pct}%</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Tap any swatch to copy. Neutrals for UI are generated separately — only
        real plumage colors are shown here.
      </p>
    </div>
  );
}
