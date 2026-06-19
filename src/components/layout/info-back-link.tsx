import Link from "next/link";

export function InfoBackLink() {
  return (
    <Link
      href="/"
      scroll={false}
      className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        width={20}
        height={20}
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform group-hover:-translate-x-0.5"
      >
        <path d="m9 14l-4-4l4-4" />
        <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
      </svg>
      back
    </Link>
  );
}
