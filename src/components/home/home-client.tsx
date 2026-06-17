"use client";

import { useMemo, useState, useEffect } from "react";
import type { BirdSummary } from "@/types/bird";
import { filterBirds, filterBirdsByColorFamily } from "@/lib/search";
import { SearchInput } from "./search-input";
import { ColorFilterBar } from "./color-filter-bar";
import { BirdThumbnail } from "./bird-thumbnail";

const PAGE_SIZE = 60;

export function HomeClient({ birds }: { birds: BirdSummary[] }) {
  const [query, setQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const results = useMemo(() => {
    let list = filterBirdsByColorFamily(birds, colorFilter);
    list = filterBirds(list, query);
    return list;
  }, [birds, query, colorFilter]);

  const visible = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, colorFilter]);

  return (
    <div className="container pb-24 pt-10 sm:pt-16">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance font-serif text-[2.25rem] leading-[1.08] tracking-tight text-foreground sm:text-[3rem]">
          Bird color combinations for design
        </h1>
        <p className="text-pretty mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Search a color or pick a bird — copy real plumage palettes into your
          work. {birds.length} birds, ready to use.
        </p>

        <div className="mx-auto mt-8 max-w-xl space-y-5">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search birds or colors…"
          />
          <ColorFilterBar
            selected={colorFilter}
            onSelect={(family) => {
              setColorFilter(family);
              if (family) setQuery("");
            }}
          />
        </div>
      </section>

      <section className="mt-14 sm:mt-20">
        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3">
              {visible.map((bird, i) => (
                <BirdThumbnail key={bird.slug} bird={bird} priority={i < 3} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="rounded-full border border-border bg-background px-5 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  Show more ({results.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="py-24 text-center text-muted-foreground">
            No birds match “{query || colorFilter}”.
          </p>
        )}
      </section>
    </div>
  );
}
