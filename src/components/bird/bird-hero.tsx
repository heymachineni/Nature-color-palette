import type { BirdDetail } from "@/types/bird";
import { BirdPhoto } from "./bird-photo";

export function BirdHero({ bird }: { bird: BirdDetail }) {
  return (
    <figure>
      <BirdPhoto
        src={bird.imageUrl}
        alt={bird.name}
        variant="hero"
        priority
        ambientColor={bird.designerModes[0]?.tokens.primary}
      />
      {(bird.imageCredit || bird.imageLicense) && (
        <figcaption className="mt-2.5 text-xs leading-relaxed text-muted-foreground sm:mt-3">
          Photograph{bird.imageCredit ? ` by ${bird.imageCredit}` : ""}
          {bird.imageLicense ? ` · ${bird.imageLicense}` : ""}
          {bird.sourceUrl && (
            <>
              {" · "}
              <a
                href={bird.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Wikimedia Commons
              </a>
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}
