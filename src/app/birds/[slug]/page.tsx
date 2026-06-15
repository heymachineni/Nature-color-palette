import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getBirdBySlug } from "@/lib/data/birds";
import { BirdHero } from "@/components/bird/bird-hero";
import { BirdIntro, BirdAbout } from "@/components/bird/bird-metadata";
import { BirdStudio } from "@/components/bird/bird-studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bird = await getBirdBySlug(slug);
  if (!bird) return { title: "Not found" };
  return {
    title: bird.name,
    description: bird.description.slice(0, 160),
    openGraph: {
      title: `${bird.name} — Nature Palette`,
      description: bird.description.slice(0, 160),
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

      <article className="mx-auto mt-5 max-w-6xl sm:mt-8">
        <div className="flex flex-col gap-5 sm:gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-x-12 lg:gap-y-4">
          <div className="order-2 lg:order-1 lg:sticky lg:top-6">
            <BirdHero bird={bird} />
          </div>

          <div className="order-1 space-y-4 lg:order-2 lg:pt-1">
            <BirdIntro bird={bird} />
            <BirdAbout bird={bird} />
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-10 sm:mt-12 sm:pt-12">
          <BirdStudio bird={bird} />
        </div>
      </article>
    </div>
  );
}
