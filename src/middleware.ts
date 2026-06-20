import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Dev / SSR: serve home at `/birds/{slug}` without generating static bird pages. */
export function middleware(request: NextRequest) {
  if (process.env.STATIC_EXPORT === "true") {
    return NextResponse.next();
  }

  if (/^\/birds\/[^/]+\/?$/.test(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/birds/:slug*"],
};
