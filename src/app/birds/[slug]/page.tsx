import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getBirdBySlug, getBirdSlugs } from "@/lib/data/birds";
import { BirdPhoto } from "@/components/bird/bird-photo";
import { ColorCombination } from "@/components/bird/color-combination";
import { UiPreview } from "@/components/bird/ui-preview";
import { SimilarBirdsSection } from "@/components/bird/similar-birds-section";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  if (process.env.STATIC_EXPORT !== "true") {
    return [];
  }
  return getBirdSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bird = await getBirdBySlug(slug);
  if (!bird) return { title: "Not found" };
  const families = bird.colorFamilies.join(", ");
  return {
    title: bird.name,
    description: `${bird.name} color combination — ${families}. Copy-ready plumage palette for design.`,
    openGraph: {
      title: `${bird.name} — Nature Palette`,
      description: `Plumage colors: ${families}`,
      images: [bird.imageUrl],
    },
  };
}

export default async function BirdPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bird = await getBirdBySlug(slug);
  if (!bird) notFound();

  return (
    <div className="container pb-20 pt-2 sm:pb-28">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All birds
      </Link>

      <article className="mx-auto mt-5 max-w-4xl space-y-10 sm:mt-8 sm:space-y-12">
        <div className="flex flex-col gap-6 sm:gap-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
          <BirdPhoto
            src={bird.imageUrl}
            alt={bird.name}
            variant="hero"
            ambientColor={bird.colors[0]?.hex}
          />

          <div className="space-y-5">
            <header>
              <h1 className="font-serif text-[1.75rem] leading-[1.08] tracking-tight text-foreground sm:text-4xl">
                {bird.name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
                <span className="italic">{bird.scientificName}</span>
                <span className="px-2 text-border">·</span>
                {bird.region}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {bird.colorFamilies.map((family) => (
                  <Badge
                    key={family}
                    variant="secondary"
                    className="font-normal capitalize"
                  >
                    {family}
                  </Badge>
                ))}
              </div>
            </header>

            <section>
              <h2 className="mb-3 text-sm font-medium text-foreground">
                Color combination
              </h2>
              <ColorCombination colors={bird.colors} />
            </section>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-foreground">In UI</h2>
            {bird.wcagAA ? (
              <Badge variant="secondary" className="font-normal text-xs">
                Passes WCAG AA
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-normal text-xs">
                Check contrast before use
              </Badge>
            )}
          </div>
          <UiPreview theme={bird.theme} />
        </section>

        <SimilarBirdsSection similar={bird.similar} />
      </article>
    </div>
  );
}
