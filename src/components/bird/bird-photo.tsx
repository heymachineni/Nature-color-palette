"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type BirdPhotoVariant = "hero" | "card" | "mini";
type PhotoOrientation = "landscape" | "portrait" | null;

const VARIANTS: Record<
  BirdPhotoVariant,
  {
    wrapper: string;
    backdrop: string;
    scrim: string;
    imgPortrait: string;
    imgLandscape: string;
    sizes: string;
  }
> = {
  /** Detail page — full photograph, height-capped on small screens. */
  hero: {
    wrapper:
      "relative w-full overflow-hidden rounded-2xl ring-1 ring-inset ring-border/50 " +
      "h-[min(36vw,200px)] sm:h-[min(42vw,260px)] md:h-[min(38vw,320px)] " +
      "lg:h-auto lg:aspect-[4/3] lg:max-h-[440px]",
    backdrop:
      "object-cover object-center scale-[1.18] blur-2xl brightness-[0.88] saturate-[1.2]",
    scrim: "bg-background/35",
    imgPortrait: "object-contain object-center p-1 sm:p-1.5",
    imgLandscape: "object-cover object-center",
    sizes: "(max-width: 1024px) 100vw, 480px",
  },
  /** Home grid — whole bird visible; ambient fill behind. */
  card: {
    wrapper:
      "relative aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-inset ring-border/50",
    backdrop:
      "object-cover object-center scale-[1.2] blur-xl brightness-[0.9] saturate-[1.15]",
    scrim: "bg-background/30",
    imgPortrait:
      "object-contain object-center p-2 transition-transform duration-700 ease-out group-hover:scale-[1.02] sm:p-3",
    imgLandscape:
      "object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]",
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  },
  /** Similar birds row. */
  mini: {
    wrapper:
      "relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-inset ring-border/50",
    backdrop:
      "object-cover object-center scale-[1.15] blur-lg brightness-[0.92] saturate-[1.1]",
    scrim: "bg-background/28",
    imgPortrait:
      "object-contain object-center p-1.5 transition-transform duration-500 ease-out group-hover:scale-[1.02] sm:p-2",
    imgLandscape:
      "object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]",
    sizes: "(max-width: 640px) 50vw, 25vw",
  },
};

function detectOrientation(width: number, height: number): "landscape" | "portrait" {
  return width > height * 1.05 ? "landscape" : "portrait";
}

/**
 * Displays the original bird photograph with an ambient backdrop.
 *
 * Portrait: object-contain — full bird visible with soft letterbox fill.
 * Landscape: object-cover — fills the container edge-to-edge.
 */
export function BirdPhoto({
  src,
  alt,
  variant,
  priority = false,
  /** Brand primary — tints the ambient layer to tie photo to palette. */
  ambientColor,
  className,
}: {
  src: string;
  alt: string;
  variant: BirdPhotoVariant;
  priority?: boolean;
  ambientColor?: string;
  className?: string;
}) {
  const v = VARIANTS[variant];
  const [failed, setFailed] = useState(false);
  const [orientation, setOrientation] = useState<PhotoOrientation>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setOrientation(detectOrientation(img.naturalWidth, img.naturalHeight));
  };

  const foregroundClass =
    orientation === "landscape" ? v.imgLandscape : v.imgPortrait;

  if (failed) {
    return (
      <div
        className={cn(
          v.wrapper,
          "flex items-center justify-center bg-muted text-xs text-muted-foreground",
          className,
        )}
      >
        Photo unavailable
      </div>
    );
  }

  return (
    <div className={cn(v.wrapper, className)}>
      {/* Ambient fill — scaled cover + blur */}
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes={v.sizes}
        priority={priority}
        className={cn("absolute inset-0", v.backdrop)}
        onError={() => setFailed(true)}
      />

      {/* Palette tint — subtle cohesion (Linear / Material You) */}
      {ambientColor && (
        <div
          aria-hidden
          className="absolute inset-0 z-[1] opacity-[0.12] mix-blend-multiply"
          style={{ backgroundColor: ambientColor }}
        />
      )}

      {/* Scrim — keeps backdrop soft on light UI chrome */}
      <div aria-hidden className={cn("absolute inset-0 z-[2]", v.scrim)} />

      {/* Sharp subject */}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={v.sizes}
        className={cn(foregroundClass, "absolute inset-0 z-[3]")}
        onLoad={onImageLoad}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
