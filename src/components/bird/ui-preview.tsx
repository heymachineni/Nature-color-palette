"use client";

import type { CSSProperties } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildThemeVarsFromTokens } from "@/lib/color/theme";
import type { ThemeTokensData } from "@/types/bird";

export function UiPreview({ theme }: { theme: ThemeTokensData }) {
  const themeVars = buildThemeVarsFromTokens(theme) as CSSProperties;

  return (
    <div
      style={themeVars}
      className="overflow-hidden rounded-xl border border-border bg-background p-4 text-foreground sm:p-5"
    >
      <p className="mb-4 text-xs text-muted-foreground">
        Bird colors on brand elements · surfaces use generated neutrals
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
        <Button size="sm" className="shrink-0">
          Get started
        </Button>

        <Button size="sm" variant="outline" className="shrink-0">
          Learn more
        </Button>

        <Card className="min-w-[200px] flex-1 border-border bg-card shadow-none">
          <CardHeader className="space-y-1 p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Card</CardTitle>
            <CardDescription className="text-xs">
              Body text on a neutral surface.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Badge variant="secondary" className="text-xs">
              Accent
            </Badge>
          </CardContent>
        </Card>

        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            placeholder="Search…"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
