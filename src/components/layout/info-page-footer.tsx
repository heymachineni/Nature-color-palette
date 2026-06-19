import Link from "next/link";
import { LinkedInIcon } from "@/components/layout/info-links";

export function InfoPageFooter() {
  return (
    <footer className="mt-16 border-t border-border pt-8">
      <div className="relative flex min-h-5 items-center justify-center">
        <Link
          href="/privacy"
          className="absolute left-0 text-sm text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          Privacy
        </Link>

        <div className="flex items-center gap-2.5 text-sm text-muted-foreground/60">
          <a
            href="https://chandumachineni.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Made by <span className="font-medium">Chandu Machineni</span>
          </a>
          <a
            href="https://www.linkedin.com/in/chandu-machineni/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chandu Machineni on LinkedIn"
            className="inline-flex transition-colors hover:text-foreground"
          >
            <LinkedInIcon className="size-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
