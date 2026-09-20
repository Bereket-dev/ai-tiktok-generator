import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Redirect old locale-prefixed user URLs to the flat flow. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /am/... or /en/... → strip locale for snap/result/admin/root
  const localeMatch = pathname.match(/^\/(am|en)(\/.*)?$/);
  if (localeMatch) {
    const rest = localeMatch[2] || "";
    // Keep legacy /create under locale if needed; otherwise flatten
    if (rest.startsWith("/create")) {
      return NextResponse.next();
    }
    const target = rest || "/";
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|_vercel|api|.*\\..*).*)"],
};
