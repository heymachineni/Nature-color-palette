"use client";

import { Copy } from "lucide-react";
import { TOKEN_LABELS } from "@/lib/color/tokens";
import type { DesignTokensData } from "@/types/bird";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCopyHex } from "./color-chip";

export function DesignTokensPanel({ tokens }: { tokens: DesignTokensData }) {
  const copy = useCopyHex();

  return (
    <div className="rounded-xl border border-border/70 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8" />
            <TableHead>Token</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TOKEN_LABELS.map(({ key, label }) => {
            const hex = tokens[key];
            return (
              <TableRow
                key={key}
                className="cursor-pointer"
                onClick={() => copy(hex)}
              >
                <TableCell className="py-2">
                  <span
                    className="block size-5 rounded ring-1 ring-inset ring-black/[0.06]"
                    style={{ backgroundColor: hex }}
                  />
                </TableCell>
                <TableCell className="py-2 text-xs text-muted-foreground">
                  {label}
                </TableCell>
                <TableCell className="py-2 text-right">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase text-foreground">
                    {hex}
                    <Copy className="size-3 text-muted-foreground" />
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
