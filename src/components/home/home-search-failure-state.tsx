"use client";

export function HomeSearchFailureState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[calc(100dvh-3rem)] items-center justify-center pb-32 pt-8 sm:pt-10">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-1">
          <span
            className="flex size-[5.25rem] shrink-0 items-center justify-center text-[3.75rem] leading-none"
            aria-hidden
          >
            🪹
          </span>

          <div className="space-y-2">
            <h2 className="font-serif text-xl tracking-tight text-foreground sm:text-2xl">
              Empty nest for now
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Something spooked the search. Give it another try.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Call them again
        </button>
      </div>
    </div>
  );
}
