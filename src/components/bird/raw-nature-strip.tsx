"use client";

import type { PaletteColorData } from "@/types/bird";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyHex } from "./color-chip";

export function RawNatureStrip({ colors }: { colors: PaletteColorData[] }) {
  const copy = useCopyHex();

  return (
    <TooltipProvider delayDuration={200}>
      <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border/70 bg-card">
        <div className="flex w-max gap-1.5 p-2">
          {colors.map((color) => (
            <Tooltip key={color.hex + color.sortOrder}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => copy(color.hex)}
                  className="size-10 shrink-0 rounded-md ring-1 ring-inset ring-black/[0.06] transition-transform hover:scale-105 active:scale-100 sm:size-11"
                  style={{ backgroundColor: color.hex }}
                  aria-label={`${color.colorName} ${color.hex}`}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-mono">
                <p className="uppercase">{color.hex}</p>
                <p className="font-sans capitalize text-muted-foreground">
                  {color.colorName} · {color.dominancePct}%
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </TooltipProvider>
  );
}
