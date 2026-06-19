"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { ColorPicker } from "./color-picker";

/**
 * Floating search, fixed to the bottom of the viewport so it's always reachable
 * without scrolling. Type any color (or name) and/or pick a precise color —
 * results combine, so you can find birds wearing both. A live count keeps text
 * and color search fully consistent.
 */
export function HomeSearch({
  query,
  onQueryChange,
  pickedColor,
  onPickColor,
  matchCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  pickedColor: string | null;
  onPickColor: (hex: string | null) => void;
  matchCount: number;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const filtering = query.trim().length > 0 || !!pickedColor;

  return (
    <>
      {/* Full-width bottom scrim — fade height unchanged; gradient spans the viewport. */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 z-40 h-40 w-screen max-w-[100vw]"
        style={{
          background:
            "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.82) 42%, transparent 100%)",
        }}
      />

      <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
        <div className="relative w-full max-w-sm">
        {pickerOpen && (
          <ColorPicker
            value={pickedColor ?? "#3B82F6"}
            onChange={onPickColor}
            onClose={() => setPickerOpen(false)}
            className="absolute bottom-[calc(100%+0.5rem)] inset-x-0 sm:inset-x-auto sm:right-0 sm:w-64"
          />
        )}

        {filtering && (
          <div className="mb-2 flex justify-center">
            <span className="rounded-full border border-border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
              <span className="font-medium text-foreground">{matchCount}</span>{" "}
              {matchCount === 1 ? "bird" : "birds"}
            </span>
          </div>
        )}

        <div className="group flex h-12 w-full items-center rounded-full border border-border bg-background/90 pl-4 pr-2 shadow-lg shadow-black/5 backdrop-blur transition-colors focus-within:border-foreground/30">
          <Search className="pointer-events-none size-[17px] shrink-0 text-muted-foreground transition-colors group-focus-within:text-foreground" />

          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search with any color"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search birds by color or name"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />

          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}

          <div className="mx-1.5 h-6 w-px shrink-0 bg-border" aria-hidden />

          {pickedColor ? (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted py-1 pl-1.5 pr-1">
              <button
                type="button"
                data-color-trigger
                onClick={() => setPickerOpen((o) => !o)}
                aria-label="Change color"
                className="flex items-center gap-1.5"
              >
                <span
                  className="size-4 rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: pickedColor }}
                />
                <span className="font-mono text-xs uppercase text-foreground">
                  {pickedColor}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onPickColor(null);
                  setPickerOpen(false);
                }}
                aria-label="Clear color"
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-color-trigger
              onClick={() => setPickerOpen((o) => !o)}
              aria-label="Pick a color"
              title="Pick a color"
              className="relative flex size-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105"
            >
              <span
                className="size-7 rounded-full ring-1 ring-inset ring-black/10"
                style={{
                  backgroundImage:
                    "conic-gradient(from 90deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)",
                }}
              />
            </button>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
