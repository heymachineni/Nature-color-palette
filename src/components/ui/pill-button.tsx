import { cn } from "@/lib/utils";

/** Shared pill control — matches Wikipedia / search actions across the app. */
export function pillButtonClass(className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted",
    className,
  );
}
