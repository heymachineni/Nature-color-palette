import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <Link
          href="/"
          className="font-serif text-lg tracking-tight text-foreground transition-opacity hover:opacity-70"
        >
          Nature Palette
        </Link>
      </div>
    </header>
  );
}
