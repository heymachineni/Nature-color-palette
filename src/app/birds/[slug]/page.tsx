import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getBirdBySlug, getBirdSlugs, getBirds } from "@/lib/data/birds";
import { hasBirdImage } from "@/lib/photos/placeholder";
import { BirdDetailContent } from "@/components/bird/bird-detail-content";

export function generateStaticParams() {
  if (process.env.STATIC_EXPORT !== "true") {
    return [];
  }
  return getBirdSlugs().map((slug) => ({ slug }));
}

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
      ...(hasBirdImage(bird.imageUrl)
        ? { images: [bird.imageUrl] }
        : {}),
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

  const all = await getBirds();
  const bySlug = new Map(all.map((b) => [b.slug, b]));
  const related = bird.similar
    .map((s) => bySlug.get(s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .slice(0, 4);

  return (
    <div className="container pb-24 pt-3 sm:pt-5">
      <Link
        href="/"
        scroll={false}
        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        All birds
      </Link>

      <div className="mt-6 sm:mt-8">
        <BirdDetailContent bird={bird} related={related} />
      </div>
    </div>
  );
}
