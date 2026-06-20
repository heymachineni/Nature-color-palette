"use client";

import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import type { BirdSummary } from "@/types/bird";
import { pillButtonClass } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";
import { BirdDetailContent } from "./bird-detail-content";

export function BirdDetailModal({
  bird,
  allBirds,
  onClose,
  onSelectBird,
}: {
  bird: BirdSummary | null;
  allBirds: BirdSummary[];
  onClose: () => void;
  onSelectBird: (bird: BirdSummary) => void;
}) {
  const open = bird !== null;
  const prevOpen = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const scrollRef = useRef<HTMLDivElement>(null);

  const bySlug = useMemo(
    () => new Map(allBirds.map((b) => [b.slug, b])),
    [allBirds],
  );

  const related = useMemo(() => {
    if (!bird) return [];
    return bird.similar
      .map((slug) => bySlug.get(slug))
      .filter((b): b is BirdSummary => Boolean(b))
      .slice(0, 4);
  }, [bird, bySlug]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 });
  }, [bird?.slug, open]);

  useEffect(() => {
    if (!open && prevOpen.current) {
      if (window.history.state?.birdModal) window.history.back();
      prevOpen.current = false;
      return;
    }

    if (!open || !bird) {
      prevOpen.current = open;
      return;
    }

    const path = `/birds/${bird.slug}`;

    if (!prevOpen.current) {
      window.history.pushState({ birdModal: true }, "", path);
    } else {
      window.history.replaceState({ birdModal: true }, "", path);
    }
    prevOpen.current = true;
  }, [open, bird?.slug, bird]);

  useEffect(() => {
    const onPop = () => {
      if (prevOpen.current) onCloseRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (!open || !bird) return null;

  const mobileCloseClass = pillButtonClass(
    "bg-background/95 shadow-lg backdrop-blur hover:bg-muted",
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${bird.name} palette`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-foreground/40 backdrop-blur-[3px] animate-in fade-in"
      />

      <div className="relative z-10 flex w-full max-w-[1200px] justify-center">
        {/* Desktop — icon only, 8px above panel (40px button + 8px gap) */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={cn(
            "absolute -top-12 right-0 hidden size-10 place-items-center rounded-full",
            "border border-border bg-background/95 text-foreground shadow-lg backdrop-blur",
            "transition-colors hover:bg-muted sm:grid",
          )}
        >
          <X className="size-4" />
        </button>

        <div className="flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[32px] bg-background shadow-2xl shadow-black/25 duration-300 animate-in fade-in slide-in-from-bottom-4 sm:max-h-[86vh] sm:rounded-[40px] sm:zoom-in-95">
          <div
            ref={scrollRef}
            className="no-scrollbar flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="p-4 pb-28 sm:p-8 sm:pb-8">
              <BirdDetailContent
                bird={bird}
                related={related}
                onSelectBird={onSelectBird}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile — pill with label */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 sm:hidden ${mobileCloseClass}`}
      >
        Close
        <X className="size-3.5" />
      </button>
    </div>
  );
}
