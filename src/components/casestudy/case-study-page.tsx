import Image from "next/image";
import Link from "next/link";
import {
  Droplets,
  Grid3x3,
  Pipette,
  Search,
  type LucideIcon,
} from "lucide-react";
import { InfoEmailLink } from "@/components/layout/info-links";
import { InfoPageFooter } from "@/components/layout/info-page-footer";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-2xl tracking-tight text-foreground">
      {children}
    </h2>
  );
}

function Figure({
  src,
  alt,
  caption,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  caption: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/40 p-1.5">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[calc(1rem-2px)] ring-1 ring-inset ring-black/[0.04]">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className="object-cover object-top"
            sizes="(max-width: 576px) 100vw, 576px"
          />
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

type Decision = {
  title: string;
  body: string;
  icon: LucideIcon;
  wash: string;
  iconColor: string;
};

const DECISIONS: Decision[] = [
  {
    title: "Real plumage, not generated swatches",
    body: "Extract color from photos at build time. Every palette bar reflects what is on the bird.",
    icon: Droplets,
    wash: "bg-[hsl(46,72%,93%)]",
    iconColor: "text-[hsl(34,52%,40%)]",
  },
  {
    title: "One grid, not ten thousand pages",
    body: "Browse every species in one place. Detail opens in a modal. Shared links still land on the right bird.",
    icon: Grid3x3,
    wash: "bg-[hsl(24,42%,92%)]",
    iconColor: "text-[hsl(18,40%,38%)]",
  },
  {
    title: "Search fixed to the bottom",
    body: "The bar stays reachable on a long grid. Name, color family, and hex filter together.",
    icon: Search,
    wash: "bg-[hsl(88,32%,90%)]",
    iconColor: "text-[hsl(95,28%,32%)]",
  },
  {
    title: "Sample from the photograph",
    body: "Hover the image, read the pixel, copy the hex. Precision straight from the plumage.",
    icon: Pipette,
    wash: "bg-[hsl(208,38%,92%)]",
    iconColor: "text-[hsl(210,36%,38%)]",
  },
];

const PIPELINE = [
  {
    step: "01",
    title: "Source photos",
    body: "One species photo each from BirdNET or iNaturalist.",
  },
  {
    step: "02",
    title: "Remove the background",
    body: "An automatic cutout strips sky, branches, and blur so only the bird stays in the image.",
  },
  {
    step: "03",
    title: "Scan every pixel",
    body: "The build walks the cutout pixel by pixel. Similar RGB values land in the same bucket. Each bucket gets a hex and a share: what percent of the bird that color covers.",
  },
  {
    step: "04",
    title: "Shape the palette",
    body: "Close shades in the same family merge into one swatch. Tiny slivers drop off. The palette bar widths match those shares.",
  },
  {
    step: "05",
    title: "Write static data",
    body: "Palettes, names, and a search index go into JSON files the site loads from the CDN.",
  },
  {
    step: "06",
    title: "Ship",
    body: "Static export to Firebase Hosting. No server needed to browse.",
  },
] as const;

const SAMPLING = [
  {
    title: "Build-time extraction",
    body: "This is how each card gets its palette bar. The photo is processed once before deploy. You see the summary: the main plumage colors and how much of the bird each one takes up.",
  },
  {
    title: "Live photo sampling",
    body: "On a bird detail page you can pick any exact spot. Move over the photo and the app maps your cursor to the matching pixel in the image, reads its RGB, and shows the hex. Tap or click to copy. Useful when you want a specific feather shade, not just the averaged swatch.",
  },
] as const;

const PRODUCT_SHOTS = [
  {
    src: "/casestudy/homepage-top.png",
    alt: "Bird Palette home grid with palette bars",
    caption: "Each card shows the bird, its name, and a proportional palette bar.",
    priority: true,
  },
  {
    src: "/casestudy/search-orange.png",
    alt: "Search results filtered by orange",
    caption: "Search by name or color. Type orange and see every bird that wears it.",
  },
  {
    src: "/casestudy/bird-detail.png",
    alt: "Bird detail with palette study and photo sampling",
    caption: "Open a bird for context, palette study, and sampling from the photo.",
  },
] as const;

export function CaseStudyPage() {
  return (
    <>
      <header className="mt-8">
        <h1 className="font-serif text-2xl tracking-tight text-foreground sm:text-[1.65rem]">
          Bird Palette
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          I extracted colors from ten thousand bird photos. The pipeline took
          longer than the interface. Bird Palette is what came out: a searchable
          catalog of real plumage color, not generated guesses.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Nature already balances contrast and hue. This project makes those
          combinations easy to browse, filter, and copy.
        </p>
      </header>

      <section className="mt-12">
        <SectionTitle>The problem</SectionTitle>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Color inspiration usually means generated palettes or mood boards.
          Beautiful, but invented. Birds already wear finished combinations under
          real light.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          The gap was access. Those palettes lived in photos and field guides,
          not in a tool you could search and copy from.
        </p>
      </section>

      <section className="mt-12">
        <SectionTitle>How it started</SectionTitle>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          On walks and in reference books, the same thought kept returning:
          nature is already beautiful, and birds especially so. Why not take
          inspiration from that directly?
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Not another random generator. A catalog of combinations evolution
          already signed off on.
        </p>
      </section>

      <section className="mt-12">
        <SectionTitle>The product</SectionTitle>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Browse birds in a grid. Search by name, color, or hex. Open a species,
          study its palette bar, hover the photo to grab any color.
        </p>

        <div className="mt-10 space-y-14">
          {PRODUCT_SHOTS.map((shot) => (
            <Figure
              key={shot.src}
              src={shot.src}
              alt={shot.alt}
              caption={shot.caption}
              priority={"priority" in shot && shot.priority}
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle>Key decisions</SectionTitle>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Four choices shaped the product.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {DECISIONS.map((d) => {
            const Icon = d.icon;
            return (
              <li
                key={d.title}
                className={`rounded-2xl p-4 ring-1 ring-inset ring-black/[0.05] ${d.wash}`}
              >
                <span
                  className={`inline-flex size-9 items-center justify-center rounded-full bg-background/70 ${d.iconColor}`}
                >
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-3 font-serif text-[15px] leading-snug tracking-tight text-foreground">
                  {d.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                  {d.body}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <SectionTitle>How it works</SectionTitle>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Most of the work happens before the site loads. Color is read from
          photos in two different ways: a full scan at build time, and a
          single-pixel picker in the browser.
        </p>
        <ol className="relative mt-8 space-y-0">
          {PIPELINE.map((item, i) => (
            <li key={item.step} className="relative flex gap-4 pb-8 last:pb-0">
              {i < PIPELINE.length - 1 && (
                <span
                  className="absolute left-[1.125rem] top-9 bottom-0 w-px bg-border"
                  aria-hidden
                />
              )}
              <span className="relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 font-mono text-[11px] tabular-nums text-muted-foreground">
                {item.step}
              </span>
              <div className="min-w-0 flex-1 rounded-xl border border-border/80 bg-muted/30 px-4 py-3.5">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 space-y-4">
          {SAMPLING.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border/80 bg-background px-4 py-3.5"
            >
              <h3 className="font-serif text-[15px] tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle>Outcome</SectionTitle>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          The library is live at{" "}
          <Link
            href="https://birdpalette.web.app"
            className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            birdpalette.web.app
          </Link>
          . Ten thousand species are browsable. The interface stayed quiet so
          the birds and their color stay central.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          The harder win was the pipeline: turning messy nature photography
          into consistent, copy-ready color data at scale.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Questions or feedback:{" "}
          <InfoEmailLink email="heymachineni@gmail.com" />
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          Open Bird Palette
        </Link>
        <Link
          href="/perch"
          className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Why I built this
        </Link>
      </div>

      <InfoPageFooter />
    </>
  );
}
