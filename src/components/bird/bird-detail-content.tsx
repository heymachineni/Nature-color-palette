import type { BirdSummary } from "@/types/bird";
import { BirdPhoto } from "@/components/bird/bird-photo";
import { BirdAbout } from "@/components/bird/bird-about";
import { PaletteStudy } from "@/components/bird/palette-study";
import { PaletteInUse } from "@/components/bird/palette-in-use";
import { BirdThumbnail } from "@/components/home/bird-thumbnail";
function SpecimenCard({ bird }: { bird: BirdSummary }) {
  return (
    <div className="rounded-2xl bg-muted/70 p-2">
      <div className="overflow-hidden rounded-xl">
        <BirdPhoto
          src={bird.imageUrl}
          alt={bird.name}
          variant="card"
          priority
          scientificName={bird.scientificName}
          commonName={bird.name}
        />
      </div>
    </div>
  );
}

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
        {/* Mobile — stacked: image → name → scientific → description → button */}
        <div className="sm:hidden">
          <div className="w-full max-w-[280px]">
            <SpecimenCard bird={bird} />
          </div>
          <h1 className="mt-4 font-serif text-xl leading-[1.1] tracking-tight text-foreground">
            {bird.name}
          </h1>
          <p className="mt-1 font-serif text-xs italic text-muted-foreground">
            {bird.scientificName}
          </p>
          <BirdAbout
            commonName={bird.name}
            scientificName={bird.scientificName}
            className="mt-3"
          />
        </div>

        {/* Tablet — row: image + names, then description below */}
        <div className="hidden sm:block lg:hidden">
          <div className="flex items-start gap-4">
            <div className="w-[calc((100%-1rem)/2)] max-w-[220px] shrink-0">
              <SpecimenCard bird={bird} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="font-serif text-2xl leading-[1.05] tracking-tight text-foreground">
                {bird.name}
              </h1>
              <p className="mt-1 font-serif text-sm italic text-muted-foreground">
                {bird.scientificName}
              </p>
            </div>
          </div>
          <BirdAbout
            commonName={bird.name}
            scientificName={bird.scientificName}
            className="mt-4"
          />
        </div>

        {/* Desktop — image left, names + description in right column */}
        <div className="hidden lg:flex lg:items-start lg:gap-6">
          <div className="w-[calc((100%-3.75rem)/4)] shrink-0">
            <SpecimenCard bird={bird} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl leading-[1.05] tracking-tight text-foreground">
              {bird.name}
            </h1>
            <p className="mt-1 font-serif text-sm italic text-muted-foreground">
              {bird.scientificName}
            </p>
            <BirdAbout
              commonName={bird.name}
              scientificName={bird.scientificName}
              className="mt-3"
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
