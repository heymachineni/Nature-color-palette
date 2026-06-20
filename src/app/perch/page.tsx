import type { Metadata } from "next";
import { InfoBackLink } from "@/components/layout/info-back-link";
import { InfoEmailLink, InfoExternalLink } from "@/components/layout/info-links";
import { InfoPageFooter } from "@/components/layout/info-page-footer";

export const metadata: Metadata = {
  title: "perch",
  description:
    "Why Bird Palette exists. Collecting real plumage color combinations from nature.",
};

const SOURCES = [
  {
    name: "BirdNET",
    href: "https://birdnet.cornell.edu/",
  },
  {
    name: "iNaturalist",
    href: "https://www.inaturalist.org/",
  },
  {
    name: "Wikipedia",
    href: "https://www.wikipedia.org/",
  },
] as const;

export default function PerchPage() {
  return (
    <div className="container pb-24 pt-3 sm:pt-5">
      <article className="mx-auto max-w-xl pt-2 sm:pt-4">
        <InfoBackLink />

        <section className="mt-8">
          <h1 className="font-serif text-2xl tracking-tight text-foreground">
            Why I built this
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            In the world I see, nature is already beautiful, and birds especially
            so. Look at almost any species and you&apos;ll find a color combination
            that feels complete in its own way: contrast, balance, and character
            already solved.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            I started Bird Palette to collect those combinations, real plumage
            colors, not guesses, and make them easy to browse and search. Take
            inspiration, or just wander through to see how many colors each bird
            carries and how they come together.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl tracking-tight text-foreground">
            Notes
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            I&apos;m actively working on this, so you may run into rough edges,
            missing photos, or colors that still need tuning. I&apos;m trying to
            make the site more accurate and smoother over time.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            If you have questions, suggestions, or just want to talk, feel free
            to email <InfoEmailLink email="heymachineni@gmail.com" />.
          </p>
        </section>

        <aside className="mt-8 rounded-[24px] border border-border/70 bg-[#f3f0ea] px-5 py-5 sm:rounded-[28px] sm:px-6">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Palettes are extracted from each bird&apos;s photo — background
            removed, then colors sampled from the plumage pixels. Photos are
            from the field, so lighting, pose, and season can shift what you
            see compared to a field-guide illustration. That is expected.
          </p>
        </aside>

        <section className="mt-12">
          <h2 className="font-serif text-2xl tracking-tight text-foreground">
            Data &amp; references
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Bird Palette is not for commercial use and is offered for
            educational and exploratory purposes. Information and images are
            credited to the sources below.
          </p>
          <ul className="mt-6 space-y-3">
            {SOURCES.map((source) => (
              <li key={source.href}>
                <InfoExternalLink href={source.href}>
                  {source.name}
                </InfoExternalLink>
              </li>
            ))}
          </ul>
        </section>

        <InfoPageFooter />
      </article>
    </div>
  );
}
