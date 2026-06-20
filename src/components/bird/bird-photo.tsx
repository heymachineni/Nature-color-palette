"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isBirdNetImageUrl } from "@/lib/photos/birdnet-placeholder";
import { fetchInaturalistPhoto } from "@/lib/photos/inaturalist";
import { hasBirdImage } from "@/lib/photos/placeholder";

type BirdPhotoVariant = "hero" | "card" | "mini" | "plate";

const VARIANTS: Record<
  BirdPhotoVariant,
  { wrapper: string; img: string; sizes: string }
> = {
  hero: {
    wrapper:
      "relative w-full overflow-hidden rounded-2xl ring-1 ring-inset ring-border/50 " +
      "h-[min(36vw,200px)] sm:h-[min(42vw,260px)] md:h-[min(38vw,320px)] " +
      "lg:h-auto lg:aspect-[4/3] lg:max-h-[440px]",
    img: "object-cover object-center",
    sizes: "(max-width: 1024px) 100vw, 480px",
  },
  card: {
    wrapper: "relative aspect-[4/3] w-full overflow-hidden",
    img: "object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105",
    sizes: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  },
  mini: {
    wrapper:
      "relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-inset ring-border/50",
    img: "object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105",
    sizes: "(max-width: 640px) 50vw, 25vw",
  },
  plate: {
    wrapper: "relative w-full overflow-hidden",
    img: "object-cover object-center",
    sizes: "(max-width: 1024px) 100vw, 560px",
  },
};

export function BirdPhoto({
  src,
  alt,
  variant,
  priority = false,
  scientificName,
  commonName,
  className,
}: {
  src: string;
  alt: string;
  variant: BirdPhotoVariant;
  priority?: boolean;
  scientificName?: string;
  commonName?: string;
  className?: string;
}) {
  const v = VARIANTS[variant];
  const [activeSrc, setActiveSrc] = useState(src);
  const [hidden, setHidden] = useState(!hasBirdImage(src));
  const [loaded, setLoaded] = useState(false);
  const inatFallback = useRef<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setActiveSrc(src);
    setHidden(!hasBirdImage(src));
    setLoaded(false);
    inatFallback.current = null;
  }, [src]);

  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, [activeSrc]);

  useEffect(() => {
    if (!scientificName || !isBirdNetImageUrl(src)) return;

    let cancelled = false;
    void fetchInaturalistPhoto(scientificName, commonName)
      .then((inat) => {
        if (!cancelled && inat) inatFallback.current = inat;
      })
      .catch(() => {
        /* network / CORS — keep BirdNET src */
      });

    return () => {
      cancelled = true;
    };
  }, [src, scientificName, commonName]);

  const onImageError = () => {
    const inat = inatFallback.current;
    if (inat && activeSrc !== inat) {
      setActiveSrc(inat);
      setHidden(false);
      setLoaded(false);
      return;
    }
    setHidden(true);
  };

  if (hidden || !hasBirdImage(activeSrc)) return null;

  return (
    <div className={cn(v.wrapper, className)}>
      {!loaded && (
        <div aria-hidden className="absolute inset-0 bg-muted shimmer" />
      )}
      {/* Native img — Next/Image can keep stale pixels when src changes on the same node. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={activeSrc}
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer"
        className={cn(
          v.img,
          "absolute inset-0 h-full w-full transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={() => setLoaded(true)}
        onError={onImageError}
      />
    </div>
  );
}
