"use client";

import {
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import type { BirdSummary } from "@/types/bird";
import { filterBirds, filterBirdsByHex } from "@/lib/search";
import { HomeSearch } from "./home-search";
import { BirdThumbnail } from "./bird-thumbnail";
import { BirdDetailModal } from "@/components/bird/bird-detail-modal";

const PAGE_SIZE = 40;
const SCROLL_KEY = "home:list-state";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function HomeClient({ birds }: { birds: BirdSummary[] }) {
  const [query, setQuery] = useState("");
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [activeBird, setActiveBird] = useState<BirdSummary | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevFilters = useRef({ query, pickedColor });
  const pendingScrollY = useRef<number | null>(null);
  const targetCount = useRef(PAGE_SIZE);

  // Live mirror of visibleCount so event handlers (click/pagehide) read the
  // current value without re-subscribing.
  const visibleCountRef = useRef(visibleCount);
  visibleCountRef.current = visibleCount;

  const results = useMemo(() => {
    let list = filterBirdsByHex(birds, pickedColor);
    list = filterBirds(list, query);
    return list;
  }, [birds, query, pickedColor]);

  const visible = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  // Reset to the top of the list only when the filters actually change (compared
  // by value so Strict Mode's double-invoke and the initial mount don't trigger
  // a reset that would wipe out the restored scroll position).
  useEffect(() => {
    const prev = prevFilters.current;
    if (prev.query === query && prev.pickedColor === pickedColor) return;
    prevFilters.current = { query, pickedColor };
    setVisibleCount(PAGE_SIZE);
    window.scrollTo(0, 0);
  }, [query, pickedColor]);

  // Take over scroll restoration from the browser/router so we control exactly
  // when the position is applied (after the saved card count is back in place).
  useIsoLayoutEffect(() => {
    const prev = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = prev;
    };
  }, []);

  // Read the saved list state once on mount. Restore the card count first so the
  // document becomes tall enough; the scroll itself is applied below, only after
  // that count has committed (otherwise scrollTo clamps to a short page).
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
      // ignore malformed state
    }
  }, []);

  // Apply the saved scroll exactly once, the moment the grid has grown to the
  // saved count. Deterministic: it fires on the render where the height is
  // sufficient. The extra rAF covers a same-frame scroll from the router.
  useIsoLayoutEffect(() => {
    if (pendingScrollY.current == null) return;
    if (visibleCount < targetCount.current) return;
    const y = pendingScrollY.current;
    pendingScrollY.current = null;
    window.scrollTo(0, y);
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [visibleCount]);

  // Save the position at the moment we leave the page — not on every scroll.
  // Saving on scroll captured the router's programmatic scroll-to-top during
  // navigation and overwrote the real position with 0. Capturing on the link
  // click (capture phase, before the router navigates) and on page hide records
  // the true position for both in-app navigation and full reloads.
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
        // storage unavailable — nothing to do
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

  const reset = () => {
    setQuery("");
    setPickedColor(null);
  };

  // Infinite scroll — load more as the sentinel nears the viewport.
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

  return (
    <div className="container pb-32 pt-8 sm:pt-10">
      <section>
        {results.length > 0 ? (
          <>
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
        ) : (
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
        )}
      </section>

      <HomeSearch
        query={query}
        onQueryChange={setQuery}
        pickedColor={pickedColor}
        onPickColor={setPickedColor}
        matchCount={results.length}
      />

      <BirdDetailModal
        bird={activeBird}
        allBirds={birds}
        onClose={() => setActiveBird(null)}
        onSelectBird={setActiveBird}
      />
    </div>
  );
}
