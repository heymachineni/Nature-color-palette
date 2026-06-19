import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
      <div className="container relative flex h-12 items-center justify-end">
        <Link
          href="/"
          scroll={false}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-base tracking-tight text-foreground transition-opacity hover:opacity-70"
        >
          Bird Palette
        </Link>
        <Link
          href="/perch"
          scroll={false}
          className="font-serif text-sm italic lowercase text-muted-foreground transition-colors hover:text-foreground"
        >
          perch
        </Link>
      </div>
    </header>
  );
}
