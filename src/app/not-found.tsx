import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-serif text-3xl text-foreground">This bird doesn’t exist.</p>
      <p className="mt-3 text-muted-foreground">
        The page you’re looking for flew away.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-foreground underline underline-offset-4 hover:opacity-70"
      >
        Back to all birds
      </Link>
    </div>
  );
}
