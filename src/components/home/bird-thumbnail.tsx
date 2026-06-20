import Link from "next/link";
import type { BirdSummary } from "@/types/bird";
import { BirdPhoto } from "@/components/bird/bird-photo";

function CardBody({ bird, priority }: { bird: BirdSummary; priority: boolean }) {
  const swatches = bird.palette.filter((c) => c.share > 0);

  return (
    <div className="rounded-2xl bg-muted/70 p-2">
      <div className="relative overflow-hidden rounded-xl group-hover:rounded-b-none">
        <BirdPhoto
          key={bird.imageUrl}
          src={bird.imageUrl}
          alt={bird.name}
          variant="card"
          priority={priority}
          scientificName={bird.scientificName}
          commonName={bird.name}
        />
      </div>

      <div className="px-1.5 pb-0.5 pt-2.5">
        <p className="truncate font-serif text-[15px] leading-tight text-foreground sm:text-base">
          {bird.name}
        </p>

        <div
          className="mt-2 flex h-3 w-full overflow-hidden rounded-full ring-1 ring-inset ring-black/[0.06]"
          aria-hidden
        >
          {swatches.map((c, i) => (
            <span
              key={`${c.hex}-${i}`}
              style={{ flexGrow: c.share, backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BirdThumbnail({
  bird,
  priority = false,
  onOpen,
}: {
  bird: BirdSummary;
  priority?: boolean;
  onOpen?: (bird: BirdSummary) => void;
}) {
  if (onOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpen(bird)}
        className="group block w-full text-left"
      >
        <CardBody bird={bird} priority={priority} />
      </button>
    );
  }

  return (
    <Link href={`/birds/${bird.slug}`} className="group block">
      <CardBody bird={bird} priority={priority} />
    </Link>
  );
}
