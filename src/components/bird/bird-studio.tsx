"use client";

import { generateTokenPairings } from "@/lib/color/token-pairings";
import type { BirdDetail } from "@/types/bird";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CuratedPalette, StudioPanel } from "./curated-palette";
import { DesignTokensPanel } from "./design-tokens-panel";
import { RawNatureStrip } from "./raw-nature-strip";
import { AccessibilitySection } from "./accessibility-section";
import { ComponentPreview } from "./component-preview";
import { SimilarBirdsSection } from "./similar-birds-section";

const MODE_LABELS: Record<string, string> = {
  authentic: "Authentic",
  saas: "SaaS",
  luxury: "Luxury",
  minimal: "Minimal",
};

export function BirdStudio({ bird }: { bird: BirdDetail }) {
  const defaultMode = bird.designerModes[0]?.id ?? "authentic";

  return (
    <div className="space-y-10 sm:space-y-12">
      <Tabs defaultValue={defaultMode}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          {bird.designerModes.map((mode) => (
            <TabsTrigger key={mode.id} value={mode.id} className="text-xs sm:text-sm">
              {MODE_LABELS[mode.id] ?? mode.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {bird.designerModes.map((mode) => {
          const accessibilityResults = generateTokenPairings(mode.tokens);

          return (
            <TabsContent key={mode.id} value={mode.id} className="space-y-8">
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {mode.insight}
                </p>
                {mode.strategy && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {mode.strategy.name}
                    </span>
                    {" · "}
                    {mode.description}
                  </p>
                )}
              </div>

              <StudioPanel title="Nature palette">
                <CuratedPalette curated={mode.curated} />
              </StudioPanel>

              <Separator />

              <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
                <div className="space-y-8 lg:col-span-2">
                  <StudioPanel title="Design tokens">
                    <DesignTokensPanel tokens={mode.tokens} />
                  </StudioPanel>

                  <StudioPanel
                    title="Raw nature"
                    meta={`${bird.paletteColors.length} extracted`}
                  >
                    <RawNatureStrip colors={bird.paletteColors} />
                  </StudioPanel>

                  <StudioPanel title="Accessibility">
                    <AccessibilitySection results={accessibilityResults} />
                  </StudioPanel>
                </div>

                <div className="lg:col-span-3">
                  <StudioPanel title="UI preview">
                    <ComponentPreview tokens={mode.tokens} />
                  </StudioPanel>
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <Separator />

      <SimilarBirdsSection similar={bird.similar} />
    </div>
  );
}
