import Link from "next/link";
import { Linkedin } from "lucide-react";

export function InfoPageFooter() {
  return (
    <footer className="mt-16 border-t border-border pt-8">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <Link
          href="/privacy"
          className="text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          Privacy
        </Link>
        <a
          href="https://chandumachineni.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          Made by Chandu Machineni
        </a>
        <a
          href="https://www.linkedin.com/in/chandu-machineni/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chandu Machineni on LinkedIn"
          className="inline-flex text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          <Linkedin className="size-4" />
        </a>
      </div>
    </footer>
  );
}
