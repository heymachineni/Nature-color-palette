"use client";

import { Copy } from "lucide-react";
import { useCopyHex } from "./color-chip";
import type { PaletteVariationData } from "@/types/bird";

const ROLES = [
  { key: "primaryHex", label: "Primary", pct: 60 },
  { key: "secondaryHex", label: "Secondary", pct: 30 },
  { key: "accentHex", label: "Accent", pct: 10 },
] as const;

export function RatioBar({ variation }: { variation: PaletteVariationData }) {
  const copy = useCopyHex();

  return (
    <div>
      <div className="flex h-24 w-full overflow-hidden rounded-2xl ring-1 ring-inset ring-black/5">
        {ROLES.map((role) => {
          const hex = variation[role.key];
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => copy(hex)}
              title={`Copy ${hex.toUpperCase()}`}
              className="group relative h-full"
              style={{ flexBasis: `${role.pct}%`, backgroundColor: hex }}
            >
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 p-2.5 text-left opacity-0 transition-opacity group-hover:opacity-100">
                <Copy className="size-3 text-white mix-blend-difference" />
                <span className="font-mono text-[10px] uppercase text-white mix-blend-difference">
                  {hex.toUpperCase()}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {ROLES.map((role) => {
          const hex = variation[role.key];
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => copy(hex)}
              className="group flex items-center gap-2.5 text-left"
              title={`Copy ${hex.toUpperCase()}`}
            >
              <span
                className="size-7 shrink-0 rounded-md ring-1 ring-inset ring-black/5"
                style={{ backgroundColor: hex }}
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium leading-tight text-foreground">
                  {role.label}
                  <span className="ml-1 text-muted-foreground">{role.pct}%</span>
                </span>
                <span className="block font-mono text-xs uppercase tracking-tight text-muted-foreground transition-colors group-hover:text-foreground">
                  {hex.toUpperCase()}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
