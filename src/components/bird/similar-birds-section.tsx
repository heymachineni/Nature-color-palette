import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { SimilarBirdData } from "@/types/bird";
import { BirdPhoto } from "./bird-photo";

export function SimilarBirdsSection({
  similar,
}: {
  similar: SimilarBirdData[];
}) {
  if (similar.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-medium text-foreground">Similar palettes</h2>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        {similar.slice(0, 4).map((bird) => (
          <Link
            key={bird.slug}
            href={`/birds/${bird.slug}`}
            className="group block"
          >
            <BirdPhoto src={bird.imageUrl} alt={bird.name} variant="mini" />
            <p className="mt-2 truncate text-sm text-foreground group-hover:underline">
              {bird.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
