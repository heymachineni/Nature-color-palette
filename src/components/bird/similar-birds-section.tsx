"use client";

import Link from "next/link";
import type { SimilarBirdData } from "@/types/bird";
import { BirdPhoto } from "./bird-photo";

export function SimilarBirdsSection({
  similar,
}: {
  similar: SimilarBirdData[];
}) {
  if (similar.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-foreground">
        Similar combinations
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {similar.map((bird) => (
          <Link
            key={bird.slug}
            href={`/birds/${bird.slug}`}
            className="group block overflow-hidden rounded-xl border border-border/70 bg-card transition-colors hover:border-border"
          >
            <BirdPhoto
              src={bird.imageUrl}
              alt={bird.name}
              variant="mini"
              className="rounded-none"
            />
            <div className="space-y-2 p-3">
              <p className="truncate text-sm font-medium text-foreground group-hover:underline">
                {bird.name}
              </p>
              <div className="flex gap-1">
                {bird.preview.map((hex) => (
                  <span
                    key={hex}
                    className="size-3 rounded-full ring-1 ring-inset ring-black/[0.08]"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
