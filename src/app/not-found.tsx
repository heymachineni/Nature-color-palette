import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container pb-20">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 pt-6 text-center sm:pt-8">
        <span className="text-5xl leading-none" aria-hidden>
          🪹
        </span>

        <div className="space-y-2">
          <h1 className="font-serif text-xl tracking-tight text-foreground sm:text-2xl">
            The birds aren&apos;t here.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            They flew away.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Find them here
        </Link>
      </div>
    </div>
  );
}
