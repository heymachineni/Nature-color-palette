import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

const linkArrowClass =
  "size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5";

function InfoInlineLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
    >
      <span className="relative pb-0.5">
        {children}
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-px w-0 bg-foreground transition-all duration-200 group-hover:w-full"
        />
      </span>
      <ArrowUpRight className={linkArrowClass} />
    </a>
  );
}

export function InfoEmailLink({
  email,
  className,
}: {
  email: string;
  className?: string;
}) {
  return (
    <InfoInlineLink href={`mailto:${email}`} external={false}>
      <span className={className}>{email}</span>
    </InfoInlineLink>
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
    <InfoInlineLink href={href} external>
      {children}
    </InfoInlineLink>
  );
}

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z" />
    </svg>
  );
}
