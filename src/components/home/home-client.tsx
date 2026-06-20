"use client";

import {
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import type { BirdSummary, DataManifest } from "@/types/bird";
import { filterBirds, filterBirdsByHex } from "@/lib/search";
import { fetchBirdPage, fetchSearchIndex } from "@/lib/data/client-birds";
import { HomeSearch } from "./home-search";
import { BirdThumbnail } from "./bird-thumbnail";
import { BirdDetailModal } from "@/components/bird/bird-detail-modal";

const PAGE_SIZE = 40;
const SCROLL_KEY = "home:list-state";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function HomeClient({
  manifest,
  initialBirds,
}: {
  manifest: DataManifest;
  initialBirds: BirdSummary[];
}) {
  const [query, setQuery] = useState("");
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [activeBird, setActiveBird] = useState<BirdSummary | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadedBirds, setLoadedBirds] = useState(initialBirds);
  const [loadedPageCount, setLoadedPageCount] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);
  const [searchIndex, setSearchIndex] = useState<BirdSummary[] | null>(null);
  const [searchIndexLoading, setSearchIndexLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevFilters = useRef({ query, pickedColor });
  const pendingScrollY = useRef<number | null>(null);
  const targetCount = useRef(PAGE_SIZE);
  const loadingPageRef = useRef(false);
  const loadedPageCountRef = useRef(loadedPageCount);
  const loadedBirdsRef = useRef(loadedBirds);

  const visibleCountRef = useRef(visibleCount);
  visibleCountRef.current = visibleCount;
  loadingPageRef.current = loadingPage;
  loadedPageCountRef.current = loadedPageCount;
  loadedBirdsRef.current = loadedBirds;

  const isFiltering = query.length > 0 || pickedColor !== null;

  useEffect(() => {
    setLoadedBirds(initialBirds);
    setLoadedPageCount(1);
    loadedPageCountRef.current = 1;
  }, [initialBirds]);

  useEffect(() => {
    if (!isFiltering || searchIndex !== null || searchIndexLoading) return;
    setSearchIndexLoading(true);
    fetchSearchIndex()
      .then(setSearchIndex)
      .finally(() => setSearchIndexLoading(false));
  }, [isFiltering, searchIndex, searchIndexLoading]);

  useEffect(() => {
    if (!activeBird || searchIndex) return;
    fetchSearchIndex().then(setSearchIndex);
  }, [activeBird, searchIndex]);

  const fetchNextPage = useCallback(async () => {
    if (
      loadingPageRef.current ||
      loadedPageCountRef.current >= manifest.pageCount
    ) {
      return;
    }
    const next = loadedPageCountRef.current + 1;
    loadingPageRef.current = true;
    setLoadingPage(true);
    try {
      const page = await fetchBirdPage(next);
      setLoadedBirds((prev) => {
        const merged = [...prev, ...page];
        loadedBirdsRef.current = merged;
        return merged;
      });
      setLoadedPageCount(next);
      loadedPageCountRef.current = next;
    } finally {
      loadingPageRef.current = false;
      setLoadingPage(false);
    }
  }, [manifest.pageCount]);

  const ensureBirdsLoaded = useCallback(
    async (minCount: number) => {
      while (
        loadedBirdsRef.current.length < minCount &&
        loadedPageCountRef.current < manifest.pageCount &&
        !loadingPageRef.current
      ) {
        await fetchNextPage();
      }
    },
    [fetchNextPage, manifest.pageCount],
  );

  const results = useMemo(() => {
    if (isFiltering) {
      if (!searchIndex) return [];
      let list = filterBirdsByHex(searchIndex, pickedColor);
      list = filterBirds(list, query);
      return list;
    }
    return loadedBirds;
  }, [isFiltering, searchIndex, loadedBirds, query, pickedColor]);

  const visible = results.slice(0, visibleCount);
  const hasMoreBrowse =
    !isFiltering &&
    (visibleCount < loadedBirds.length ||
      loadedPageCount < manifest.pageCount);
  const hasMoreFilter = isFiltering && visibleCount < results.length;
  const hasMore = hasMoreBrowse || hasMoreFilter;

  const allBirds = useMemo(() => {
    const map = new Map<string, BirdSummary>();
    for (const b of loadedBirds) map.set(b.slug, b);
    if (searchIndex) {
      for (const b of searchIndex) map.set(b.slug, b);
    }
    return [...map.values()];
  }, [loadedBirds, searchIndex]);

  useEffect(() => {
    const prev = prevFilters.current;
    if (prev.query === query && prev.pickedColor === pickedColor) return;
    prevFilters.current = { query, pickedColor };
    setVisibleCount(PAGE_SIZE);
    window.scrollTo(0, 0);
  }, [query, pickedColor]);

  useIsoLayoutEffect(() => {
    const prev = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = prev;
    };
  }, []);

  useIsoLayoutEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(SCROLL_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    try {
      const { count, scrollY } = JSON.parse(raw) as {
        count?: number;
        scrollY?: number;
      };
      if (typeof count === "number") {
        targetCount.current = Math.max(count, PAGE_SIZE);
        setVisibleCount(targetCount.current);
      }
      if (typeof scrollY === "number" && scrollY > 0) {
        pendingScrollY.current = scrollY;
      }
    } catch {
      /* ignore malformed state */
    }
  }, []);

  useEffect(() => {
    if (isFiltering || pendingScrollY.current == null) return;
    const count = targetCount.current;
    if (loadedBirds.length >= count || loadedPageCount >= manifest.pageCount) {
      return;
    }
    void ensureBirdsLoaded(count);
  }, [
    isFiltering,
    loadedBirds.length,
    loadedPageCount,
    manifest.pageCount,
    ensureBirdsLoaded,
  ]);

  useIsoLayoutEffect(() => {
    if (pendingScrollY.current == null) return;
    if (visibleCount < targetCount.current) return;
    if (!isFiltering && loadedBirds.length < targetCount.current) return;
    const y = pendingScrollY.current;
    pendingScrollY.current = null;
    window.scrollTo(0, y);
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [visibleCount, isFiltering, loadedBirds.length]);

  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(
          SCROLL_KEY,
          JSON.stringify({
            count: visibleCountRef.current,
            scrollY: window.scrollY,
          }),
        );
      } catch {
        /* storage unavailable */
      }
    };
    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("a[href]")) save();
    };
    const onPageHide = () => save();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };

    window.addEventListener("click", onClickCapture, { capture: true });
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("click", onClickCapture, { capture: true });
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (isFiltering || loadingPage) return;
    if (
      visibleCount + PAGE_SIZE > loadedBirds.length &&
      loadedPageCount < manifest.pageCount
    ) {
      void fetchNextPage();
    }
  }, [
    isFiltering,
    visibleCount,
    loadedBirds.length,
    loadedPageCount,
    manifest.pageCount,
    loadingPage,
    fetchNextPage,
  ]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((n) => n + PAGE_SIZE);
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visible.length]);

  const reset = () => {
    setQuery("");
    setPickedColor(null);
  };

  const showEmpty =
    !searchIndexLoading && results.length === 0 && (isFiltering || !loadingPage);
  const showGrid = results.length > 0 || searchIndexLoading || loadingPage;

  return (
    <div className="container pb-32 pt-8 sm:pt-10">
      <section>
        {showGrid ? (
          <>
            {(searchIndexLoading || (loadingPage && visible.length === 0)) && (
              <p className="mb-6 text-center text-sm text-muted-foreground">
                Loading birds…
              </p>
            )}
            <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {visible.map((bird, i) => (
                <BirdThumbnail
                  key={bird.slug}
                  bird={bird}
                  priority={i < 4}
                  onOpen={setActiveBird}
                />
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} className="h-px w-full" />}
          </>
        ) : showEmpty ? (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            {pickedColor && (
              <span
                className="size-12 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: pickedColor }}
              />
            )}
            <div className="space-y-1">
              <p className="font-serif text-lg text-foreground">
                No birds wear{" "}
                {pickedColor ? (
                  <span className="font-mono uppercase">{pickedColor}</span>
                ) : (
                  <span>“{query}”</span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Try a different or nearby color.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-border bg-background px-5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Show all birds
            </button>
          </div>
        ) : null}
      </section>

      <HomeSearch
        query={query}
        onQueryChange={setQuery}
        pickedColor={pickedColor}
        onPickColor={setPickedColor}
        matchCount={isFiltering ? results.length : manifest.total}
      />

      <BirdDetailModal
        bird={activeBird}
        allBirds={allBirds}
        onClose={() => setActiveBird(null)}
        onSelectBird={setActiveBird}
      />
    </div>
  );
}
