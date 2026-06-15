"use client";

import { Search, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="group relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search birds…"
        autoComplete="off"
        spellCheck={false}
        aria-label="Search birds by name or color"
        className="h-14 w-full rounded-2xl border border-border bg-background/60 pl-12 pr-12 text-base text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-foreground/30 focus:bg-background"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
