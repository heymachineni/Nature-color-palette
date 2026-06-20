import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "birdnet.cornell.edu",
  "cdn.download.ams.birds.cornell.edu",
  "inaturalist-open-data.s3.amazonaws.com",
  "static.inaturalist.org",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
]);

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  try {
    const resp = await fetch(parsed.toString(), {
      headers: { Accept: "image/*" },
      next: { revalidate: 86400 },
    });
    if (!resp.ok) {
      return new NextResponse(null, { status: resp.status });
    }

    const body = await resp.arrayBuffer();
    const contentType = resp.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
