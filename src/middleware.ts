import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = process.env.CANONICAL_HOST?.toLowerCase().trim();

export function middleware(request: NextRequest) {
  const rawHost = (request.headers.get("host") ?? "").toLowerCase();
  const host = rawHost.split(":")[0];
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const isVercelHost = host.endsWith(".vercel.app");

  if (CANONICAL_HOST && !isLocal && !isVercelHost && host !== CANONICAL_HOST) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://vitals.vercel-insights.com; font-src 'self' data:; frame-ancestors 'none';",
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
