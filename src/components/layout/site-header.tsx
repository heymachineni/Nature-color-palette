import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-12 items-center justify-center">
        <Link
          href="/"
          scroll={false}
          className="font-serif text-base tracking-tight text-foreground transition-opacity hover:opacity-70"
        >
          Nature Palette
        </Link>
      </div>
    </header>
  );
}
