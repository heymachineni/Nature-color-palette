import type { Metadata } from "next";
import { InfoBackLink } from "@/components/layout/info-back-link";
import { InfoEmailLink } from "@/components/layout/info-links";
import { InfoPageFooter } from "@/components/layout/info-page-footer";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for Bird Palette.",
};

export default function PrivacyPage() {
  return (
    <div className="container pb-24 pt-3 sm:pt-5">
      <article className="mx-auto max-w-xl pt-2 sm:pt-4">
        <InfoBackLink />

        <h1 className="mt-8 font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: June 19, 2026
        </p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <p>
              Bird Palette is a simple, static website for browsing bird plumage
              colors. We take your privacy seriously, which is easy, because we
              collect absolutely nothing on our own servers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-foreground">
              Information we collect
            </h2>
            <p className="mt-3">
              None. Bird Palette does not run accounts, analytics, or backend
              tracking. We do not collect, transmit, or store personal
              information or usage data through this site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-foreground">Data storage</h2>
            <p className="mt-3">
              Bird data and palettes are bundled with the site. Your browser may
              save scroll position locally while you browse (for example, in
              session storage), and that stays on your device.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-foreground">
              Third-party services
            </h2>
            <p className="mt-3">
              When you view birds, your browser may request photos from BirdNET
              or iNaturalist and short descriptions from Wikipedia. Those
              requests go directly from your device to those services, not
              through Bird Palette servers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-foreground">
              Children&apos;s privacy
            </h2>
            <p className="mt-3">
              Bird Palette does not collect data from anyone, including children.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-foreground">Cookies</h2>
            <p className="mt-3">
              Birds might eat cookies, but this site does not set tracking
              cookies or ask you to accept any. If that ever changes, this page
              will say so.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-foreground">
              Changes to this policy
            </h2>
            <p className="mt-3">
              If we update this policy, we&apos;ll post the new version here with
              an updated date.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-foreground">Contact</h2>
            <p className="mt-3">
              Questions? Reach out at{" "}
              <InfoEmailLink email="heymachineni@gmail.com" />.
            </p>
          </section>
        </div>

        <InfoPageFooter />
      </article>
    </div>
  );
}
