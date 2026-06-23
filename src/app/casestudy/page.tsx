import type { Metadata } from "next";
import { CaseStudyPage } from "@/components/casestudy/case-study-page";
import { InfoBackLink } from "@/components/layout/info-back-link";

export const metadata: Metadata = {
  title: "Case study",
  description:
    "How Bird Palette turned real bird plumage into a searchable color library.",
};

export default function CaseStudyRoute() {
  return (
    <div className="container pb-24 pt-3 sm:pt-5">
      <article className="mx-auto max-w-xl pt-2 sm:pt-4">
        <InfoBackLink />
        <CaseStudyPage />
      </article>
    </div>
  );
}
