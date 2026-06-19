import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export function InfoEmailLink({
  email,
  className,
}: {
  email: string;
  className?: string;
}) {
  return (
    <a
      href={`mailto:${email}`}
      className={`group inline-flex items-center gap-1 font-medium text-muted-foreground/70 transition-colors hover:text-foreground ${className ?? ""}`}
    >
      <span>{email}</span>
      <ArrowUpRight className="size-3.5 rotate-12 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:rotate-[24deg]" />
    </a>
  );
}

export function InfoExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
    >
      <span className="relative pb-0.5">
        {children}
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-px w-0 bg-foreground transition-all duration-200 group-hover:w-full"
        />
      </span>
      <ArrowUpRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}
