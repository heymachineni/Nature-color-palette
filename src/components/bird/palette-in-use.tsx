"use client";

import { useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { hexToRgb, rgbToHsl } from "@/lib/color/convert";
import type { PlumageColorData } from "@/types/bird";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MuiDashboard } from "./mui-dashboard";

type Mode = "light" | "dark";

function pickPrimary(colors: PlumageColorData[]): string {
  const meta = colors.map((c) => ({ hex: c.hex, ...rgbToHsl(hexToRgb(c.hex)) }));
  const mid = meta.filter((m) => m.l >= 22 && m.l <= 78);
  const pool = mid.length ? mid : meta;
  return [...pool].sort((a, b) => b.s - a.s)[0]?.hex ?? colors[0].hex;
}

export function PaletteInUse({ colors }: { colors: PlumageColorData[] }) {
  const initial = useMemo(() => pickPrimary(colors), [colors]);
  const [primary, setPrimary] = useState(initial);
  const [mode, setMode] = useState<Mode>("light");

  if (colors.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl tracking-tight text-foreground sm:text-2xl">
            In use
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            See primary colors on the MUI dashboard template
          </p>
        </div>

        <TooltipProvider delayDuration={300}>
          <div
            className="flex items-center rounded-full border border-border bg-background p-0.5"
            role="group"
            aria-label="Theme mode"
          >
            {(["light", "dark"] as const).map((m) => {
              const label = m === "light" ? "Light mode" : "Dark mode";
              return (
                <Tooltip key={m}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setMode(m)}
                      aria-label={label}
                      aria-pressed={mode === m}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full transition-colors",
                        mode === m
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m === "light" ? (
                        <Sun className="size-4" />
                      ) : (
                        <Moon className="size-4" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[100]">
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-muted-foreground">Primary</span>
        {colors.map((c, i) => {
          const selected = primary === c.hex;
          return (
            <button
              key={`${c.hex}-${i}`}
              type="button"
              title={c.hex.toUpperCase()}
              aria-label={`Use ${c.hex.toUpperCase()} as primary`}
              onClick={() => setPrimary(c.hex)}
              className={cn(
                "size-7 rounded-full ring-1 ring-inset ring-black/10 transition-transform hover:scale-110",
                selected &&
                  "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>

      <MuiDashboard primary={primary} mode={mode} />
    </section>
  );
}
