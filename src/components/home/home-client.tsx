"use client";

import { useMemo, useState } from "react";
import type { BirdSummary } from "@/types/bird";
import { filterBirds } from "@/lib/search";
import { SearchInput } from "./search-input";
import { BirdThumbnail } from "./bird-thumbnail";

const SUGGESTED_COLORS = ["red", "blue", "green", "yellow", "orange", "brown"];

export function HomeClient({ birds }: { birds: BirdSummary[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterBirds(birds, query), [birds, query]);

  return (
    <div className="container pb-24 pt-10 sm:pt-20">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance font-serif text-[2.5rem] leading-[1.05] tracking-tight text-foreground sm:text-[3.25rem]">
          Color systems, perfected by nature.
        </h1>
        <p className="text-pretty mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Designer-ready palettes drawn from {birds.length} birds — each one
          accessible, balanced, and ready to copy.
        </p>

        <div className="mx-auto mt-9 max-w-xl">
          <SearchInput value={query} onChange={setQuery} />
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
            <span>Try a color:</span>
            {SUGGESTED_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setQuery(color)}
                className="rounded-md px-1.5 py-0.5 text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 sm:mt-24">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3">
            {results.map((bird, i) => (
              <BirdThumbnail key={bird.id} bird={bird} priority={i < 3} />
            ))}
          </div>
        ) : (
          <p className="py-24 text-center text-muted-foreground">
            No birds match “{query}”.
          </p>
        )}
      </section>
    </div>
  );
}
