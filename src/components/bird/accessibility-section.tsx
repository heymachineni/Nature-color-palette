import type { AccessibilityResultData } from "@/types/bird";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AccessibilitySection({
  results,
}: {
  results: AccessibilityResultData[];
}) {
  if (results.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-14" />
            <TableHead>Pairing</TableHead>
            <TableHead className="text-right">Ratio</TableHead>
            <TableHead className="hidden w-28 text-right sm:table-cell">
              WCAG
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.slice(0, 5).map((result, i) => (
            <TableRow key={i}>
              <TableCell className="py-2">
                <div
                  className="flex size-9 items-center justify-center rounded-md text-xs font-medium ring-1 ring-inset ring-black/[0.06]"
                  style={{
                    backgroundColor: result.background,
                    color: result.foreground,
                  }}
                >
                  Aa
                </div>
              </TableCell>
              <TableCell className="py-2">
                <p className="text-xs text-foreground">
                  {result.label ?? "Pairing"}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                  {result.foreground} / {result.background}
                </p>
              </TableCell>
              <TableCell className="py-2 text-right text-xs tabular-nums text-foreground">
                {result.contrastRatio.toFixed(1)}:1
              </TableCell>
              <TableCell className="hidden py-2 text-right sm:table-cell">
                <div className="flex justify-end gap-1">
                  <Badge
                    variant={result.levelAA ? "secondary" : "outline"}
                    className={cn(
                      "h-5 px-1.5 text-[10px] font-normal",
                      !result.levelAA && "opacity-40",
                    )}
                  >
                    AA
                  </Badge>
                  <Badge
                    variant={result.levelAAA ? "secondary" : "outline"}
                    className={cn(
                      "h-5 px-1.5 text-[10px] font-normal",
                      !result.levelAAA && "opacity-40",
                    )}
                  >
                    AAA
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
