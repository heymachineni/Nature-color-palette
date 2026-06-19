"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { pillButtonClass } from "@/components/ui/pill-button";

type Summary = { extract: string; url: string };

const SUMMARY_API =
  "https://en.wikipedia.org/api/rest_v1/page/summary/";

async function fetchSummary(
  title: string,
  signal: AbortSignal,
): Promise<Summary | null> {
  try {
    const res = await fetch(SUMMARY_API + encodeURIComponent(title), {
      signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      type?: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
    };
    if (data.type === "disambiguation" || !data.extract) return null;
    return {
      extract: data.extract,
      url:
        data.content_urls?.desktop?.page ??
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}

export function BirdAbout({
  commonName,
  scientificName,
  className,
}: {
  commonName: string;
  scientificName: string;
  className?: string;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState<"loading" | "done">("loading");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setSummary(null);

    (async () => {
      const result =
        (await fetchSummary(commonName, controller.signal)) ??
        (await fetchSummary(scientificName, controller.signal));
      if (controller.signal.aborted) return;
      setSummary(result);
      setStatus("done");
    })();

    return () => controller.abort();
  }, [commonName, scientificName]);

  if (status === "loading") {
    return (
      <div className={className} aria-hidden>
        <div className="mt-3 space-y-2">
          <div className="shimmer h-3 w-full rounded bg-muted" />
          <div className="shimmer h-3 w-[92%] rounded bg-muted" />
          <div className="shimmer h-3 w-[60%] rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className={className}>
      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {summary.extract}
      </p>
      <a
        href={summary.url}
        target="_blank"
        rel="noopener noreferrer"
        className={pillButtonClass("mt-3")}
      >
        Read more on Wikipedia
        <ArrowUpRight className="size-3.5" />
      </a>
    </div>
  );
}
