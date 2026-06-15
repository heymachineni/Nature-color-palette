"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function useCopyHex() {
  return async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      toast.success(`Copied ${hex.toUpperCase()}`);
    } catch {
      toast.error("Couldn’t copy");
    }
  };
}

export function ColorChip({
  hex,
  caption,
  meta,
  className,
}: {
  hex: string;
  caption?: string;
  meta?: string;
  className?: string;
}) {
  const copy = useCopyHex();
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    await copy(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handle}
      className={cn("group block text-left", className)}
      title={`Copy ${hex.toUpperCase()}`}
    >
      <span
        className="relative flex h-16 w-full items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 transition-transform duration-200 group-hover:scale-[1.02] group-active:scale-100"
        style={{ backgroundColor: hex }}
      >
        <Check
          className={cn(
            "size-4 text-white mix-blend-difference transition-opacity",
            copied ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
      <span className="mt-2 block font-mono text-xs uppercase tracking-tight text-foreground">
        {hex.toUpperCase()}
      </span>
      {caption && (
        <span className="block text-xs capitalize text-muted-foreground">
          {caption}
          {meta ? ` · ${meta}` : ""}
        </span>
      )}
    </button>
  );
}
