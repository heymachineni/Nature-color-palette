"use client";

import type { CSSProperties } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { buildThemeVarsFromTokens } from "@/lib/color/theme";
import type { DesignTokensData } from "@/types/bird";

export function ComponentPreview({ tokens }: { tokens: DesignTokensData }) {
  const themeVars = buildThemeVarsFromTokens(tokens) as CSSProperties;

  return (
    <div
      style={themeVars}
      className="overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm"
    >
      {/* Nav — neutral chrome, brand on active item only */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-5">
        <span className="text-sm font-semibold tracking-tight">Workspace</span>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <span className="font-medium text-primary">Overview</span>
          <span className="text-muted-foreground">Projects</span>
          <span className="text-muted-foreground">Settings</span>
        </nav>
        <Button size="sm">New project</Button>
      </header>

      <div className="p-4 sm:p-5">
        <Tabs defaultValue="overview">
          <TabsList className="mb-5 h-9 w-full max-w-[280px] bg-muted">
            <TabsTrigger
              value="overview"
              className="flex-1 text-xs data-[state=active]:text-primary"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex-1 text-xs data-[state=active]:text-primary"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h4 className="text-base font-semibold">Dashboard</h4>
                <p className="text-sm text-muted-foreground">
                  Neutral surfaces with brand on actions.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Export
                </Button>
                <Button size="sm">Save changes</Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Total views", value: "12,480" },
                { label: "Active users", value: "892" },
                { label: "Completion", value: "94%" },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="border-border bg-card shadow-none"
                >
                  <CardHeader className="space-y-1 p-4 pb-1">
                    <CardDescription className="text-xs">
                      {stat.label}
                    </CardDescription>
                    <CardTitle className="text-xl font-semibold tabular-nums">
                      {stat.value}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Card className="border-border bg-card shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      Recent activity
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Informational content stays neutral.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-normal">
                    3 updates
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {["Palette exported", "Team member invited", "Settings saved"].map(
                  (item, i) => (
                    <div
                      key={item}
                      className={cn(
                        "flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm",
                        i === 0 && "border-primary/20 bg-primary/[0.03]",
                      )}
                    >
                      <span className={i === 0 ? "font-medium" : ""}>
                        {item}
                      </span>
                      {i === 0 && (
                        <span className="text-xs font-medium text-primary">
                          Latest
                        </span>
                      )}
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <Card className="border-border bg-card shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Preferences
                </CardTitle>
                <CardDescription className="text-xs">
                  Forms use neutral borders; focus ring uses brand color.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="border-border bg-background pl-9"
                    placeholder="Search settings…"
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">Email notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Product updates
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">Weekly digest</p>
                    <p className="text-xs text-muted-foreground">
                      Summary every Monday
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
              <CardFooter className="gap-2 border-t border-border pt-4">
                <Button size="sm">Save</Button>
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
