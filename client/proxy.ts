import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // Allow unrestricted access to the videon proxy routes (for SDK communication)
  if (pathname.startsWith("/api/videon")) {
    return NextResponse.next();
  }

  // Public watch pages are open; the server only resolves slugs for videos
  // that are public and ready, so the slug itself is the access gate.
  if (pathname === "/v" || pathname.startsWith("/v/")) {
    return NextResponse.next();
  }

  // Landing pages and Clerk auth pages are public
  if (
    pathname === "/" ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup")
  ) {
    return NextResponse.next();
  }

  // Everything else (dashboard routes) requires authentication;
  // unauthenticated users are redirected to the landing page.
  if (!userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};