"use client";

import { cn } from "@/lib/utils";
import { normalizeColorQuery } from "@/lib/color/naming";

const COLOR_FAMILIES = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "brown",
  "black",
  "white",
] as const;

export function ColorFilterBar({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (family: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Start with a color</p>
      <div className="flex flex-wrap justify-center gap-2">
        {COLOR_FAMILIES.map((color) => {
          const active =
            selected !== null &&
            normalizeColorQuery(selected) === normalizeColorQuery(color);
          return (
            <button
              key={color}
              type="button"
              onClick={() => onSelect(active ? null : color)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground/80 hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {color}
            </button>
          );
        })}
      </div>
    </div>
  );
}
