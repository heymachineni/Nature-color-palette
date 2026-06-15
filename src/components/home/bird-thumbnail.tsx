import Link from "next/link";
import type { BirdSummary } from "@/types/bird";
import { BirdPhoto } from "@/components/bird/bird-photo";

export function BirdThumbnail({
  bird,
  priority = false,
}: {
  bird: BirdSummary;
  priority?: boolean;
}) {
  return (
    <Link href={`/birds/${bird.slug}`} className="group block">
      <BirdPhoto
        src={bird.imageUrl}
        alt={bird.name}
        variant="card"
        priority={priority}
        ambientColor={bird.palettePreview[0]}
      />

      <div className="mt-3 flex items-start justify-between gap-3 sm:mt-3.5">
        <div className="min-w-0">
          <p className="truncate font-serif text-base leading-tight text-foreground sm:text-[17px]">
            {bird.name}
          </p>
          <p className="mt-0.5 truncate text-sm italic text-muted-foreground">
            {bird.scientificName}
          </p>
        </div>
        <div
          className="mt-0.5 flex shrink-0 overflow-hidden rounded-full ring-1 ring-inset ring-border/70 sm:mt-1"
          aria-hidden
        >
          {bird.palettePreview.slice(0, 5).map((hex, i) => (
            <span
              key={hex + i}
              className="size-3 sm:size-3.5"
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}
