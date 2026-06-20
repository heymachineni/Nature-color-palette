"use client";

import type { BirdSummary } from "@/types/bird";
import { BirdAbout } from "@/components/bird/bird-about";
import { PaletteStudy } from "@/components/bird/palette-study";
import { PaletteInUse } from "@/components/bird/palette-in-use";
import { BirdThumbnail } from "@/components/home/bird-thumbnail";
import { PhotoPalettePicker } from "@/components/bird/photo-palette-picker";

export function BirdDetailContent({
  bird,
  related,
  onSelectBird,
}: {
  bird: BirdSummary;
  related: BirdSummary[];
  onSelectBird?: (bird: BirdSummary) => void;
}) {
  return (
    <article>
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:gap-6">
          <div className="w-full max-w-[280px] shrink-0 sm:max-w-[220px] lg:max-w-none lg:w-[calc((100%-3.75rem)/4)]">
            <PhotoPalettePicker
              src={bird.imageUrl}
              alt={bird.name}
              priority
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-xl leading-[1.1] tracking-tight text-foreground sm:text-2xl lg:text-3xl lg:leading-[1.05]">
              {bird.name}
            </h1>
            <p className="mt-1 font-serif text-xs italic text-muted-foreground sm:text-sm">
              {bird.scientificName}
            </p>
            <BirdAbout
              commonName={bird.name}
              scientificName={bird.scientificName}
              className="mt-3 sm:mt-4 lg:mt-3"
            />
          </div>
        </div>
      </header>

      <PaletteStudy colors={bird.colors} />

      <PaletteInUse colors={bird.colors} />

      {related.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <div className="mb-5">
            <h2 className="font-serif text-xl tracking-tight text-foreground sm:text-2xl">
              Related palettes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Birds with a similar combination
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
            {related.map((b) => (
              <BirdThumbnail key={b.slug} bird={b} onOpen={onSelectBird} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
