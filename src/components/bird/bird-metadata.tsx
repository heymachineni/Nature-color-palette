import { Badge } from "@/components/ui/badge";
import type { BirdDetail } from "@/types/bird";

export function BirdIntro({ bird }: { bird: BirdDetail }) {
  return (
    <header>
      <h1 className="font-serif text-[1.75rem] leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
        {bird.name}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
        <span className="italic">{bird.scientificName}</span>
        <span className="px-2 text-border">·</span>
        {bird.region}
      </p>

      {bird.characterTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {bird.characterTags.slice(0, 6).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="font-normal capitalize"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </header>
  );
}

export function BirdAbout({ bird }: { bird: BirdDetail }) {
  return (
    <p className="line-clamp-4 text-pretty text-[15px] leading-relaxed text-foreground/75 sm:line-clamp-none">
      {bird.description}
    </p>
  );
}
