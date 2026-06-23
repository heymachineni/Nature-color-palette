import Image from "next/image";
import Link from "next/link";
import {
  Crosshair,
  Droplets,
  Grid3x3,
  Layers,
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

function PaletteBarPreview() {
  return (
    <div
      className="mt-5 flex h-2.5 overflow-hidden rounded-full ring-1 ring-inset ring-black/[0.06]"
      aria-hidden
    >
      <span className="bg-[#3d5a3e]" style={{ width: "36%" }} />
      <span className="bg-[#c9a24d]" style={{ width: "26%" }} />
      <span className="bg-[#8b5e3c]" style={{ width: "22%" }} />
      <span className="bg-[#e8e2d6]" style={{ width: "16%" }} />
    </div>
  );
}

function SamplerPreview() {
  return (
    <div
      className="relative mt-5 aspect-[5/2] overflow-hidden rounded-xl bg-[linear-gradient(135deg,#4a6741_0%,#8b6914_55%,#2c3e50_100%)] ring-1 ring-inset ring-black/[0.06]"
      aria-hidden
    >
      <span className="absolute inset-0 bg-black/[0.08]" />
      <span className="absolute left-[58%] top-[42%] h-px w-full -translate-y-1/2 bg-white/35" />
      <span className="absolute left-[58%] top-[42%] h-full w-px -translate-x-1/2 bg-white/35" />
      <span className="absolute left-[58%] top-[42%] size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 bg-[#8b6914] shadow-sm" />
      <span className="absolute bottom-2 right-2 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
        #8B6914
      </span>
    </div>
  );
}

type ColorMode = {
  title: string;
  when: string;
  body: string;
  icon: LucideIcon;
  wash: string;
  iconColor: string;
  preview: "palette" | "sampler";
};

const COLOR_MODES: ColorMode[] = [
  {
    title: "Build-time extraction",
    when: "Before deploy",
    body: "Each photo is scanned once. The palette bar on every card is the summary: main plumage hues and the share each one takes up.",
    icon: Layers,
    wash: "bg-[hsl(46,72%,93%)]",
    iconColor: "text-[hsl(34,52%,40%)]",
    preview: "palette",
  },
  {
    title: "Live photo sampling",
    when: "In the browser",
    body: "Hover any spot on the bird photo. The app reads that exact pixel and shows the hex. Click to copy a specific feather shade.",
    icon: Crosshair,
    wash: "bg-[hsl(208,38%,92%)]",
    iconColor: "text-[hsl(210,36%,38%)]",
    preview: "sampler",
  },
];

const STATS = [
  {
    value: "10,000+",
    label: "species in the catalog",
  },
  {
    value: "~24",
    label: "primary colors scanned per bird",
  },
  {
    value: "3",
    label: "ways to search or copy color",
    detail: "Palette bar · search · photo sample",
  },
] as const;

const STACK = [
  { name: "ChatGPT", note: "Ideas & copy" },
  { name: "Cursor", note: "Build & ship" },
  { name: "A brain", note: "Taste & decisions" },
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

        <dl className="mt-8 grid divide-y divide-border rounded-2xl border border-border/80 bg-muted/25 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-4 py-5 text-center sm:px-3">
              <dt className="font-serif text-2xl tracking-tight text-foreground tabular-nums">
                {stat.value}
              </dt>
              <dd className="mt-1.5 text-xs leading-snug text-muted-foreground">
                {stat.label}
              </dd>
              {"detail" in stat && stat.detail ? (
                <dd className="mt-1 font-mono text-[10px] tracking-wide text-muted-foreground/70">
                  {stat.detail}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
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
          Color is read from photos in two ways. One powers every card in the
          grid. The other lets you pick a single pixel on demand.
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {COLOR_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <li
                key={mode.title}
                className={`flex flex-col rounded-2xl p-4 ring-1 ring-inset ring-black/[0.05] ${mode.wash}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-background/70 ${mode.iconColor}`}
                  >
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="pt-1 font-mono text-[10px] uppercase tracking-wider text-foreground/45">
                    {mode.when}
                  </span>
                </div>
                <h3 className="mt-3 font-serif text-[15px] leading-snug tracking-tight text-foreground">
                  {mode.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/75">
                  {mode.body}
                </p>
                {mode.preview === "palette" ? (
                  <PaletteBarPreview />
                ) : (
                  <SamplerPreview />
                )}
              </li>
            );
          })}
        </ul>

        <h3 className="mt-12 font-serif text-lg tracking-tight text-foreground">
          The build pipeline
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          How each palette bar is made before the site ships.
        </p>
        <ol className="relative mt-6 space-y-0">
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

        <h3 className="mt-8 font-serif text-lg tracking-tight text-foreground">
          Stack
        </h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {STACK.map((tool) => (
            <li
              key={tool.name}
              className="rounded-full border border-border bg-muted/40 px-3.5 py-1.5"
            >
              <span className="text-sm text-foreground">{tool.name}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">
                · {tool.note}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-[15px] leading-relaxed text-muted-foreground">
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
