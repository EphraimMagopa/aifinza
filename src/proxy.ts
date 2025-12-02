// Next.js 16 proxy.ts - Replaces middleware.ts
// Runs on Node.js runtime (not Edge)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
	"/",
	"/signin",
	"/signup",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
	"/pricing",
	"/features",
	"/contact",
	"/about",
	"/terms",
	"/privacy",
];

// API routes that should be publicly accessible
const publicApiRoutes = ["/api/auth", "/api/health"];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Static files and Next.js internals - always allow
	if (
		pathname.startsWith("/_next/") ||
		pathname.startsWith("/favicon") ||
		pathname.includes(".") ||
		pathname.startsWith("/api/auth")
	) {
		return NextResponse.next();
	}

	// Check if current route is public
	const isPublicRoute = publicRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`)
	);

	// Check if it's a public API route
	const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

	// Allow public routes
	if (isPublicRoute || isPublicApiRoute) {
		return NextResponse.next();
	}

	// For protected routes, check for session cookie
	const sessionToken =
		request.cookies.get("authjs.session-token") ||
		request.cookies.get("__Secure-authjs.session-token") ||
		request.cookies.get("next-auth.session-token") ||
		request.cookies.get("__Secure-next-auth.session-token");

	if (!sessionToken) {
		// Redirect to signin for page requests
		if (!pathname.startsWith("/api/")) {
			const signinUrl = new URL("/signin", request.url);
			signinUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(signinUrl);
		}

		// Return 401 for API requests
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	return NextResponse.next();
}

export const config = {
	// Match all routes except static files
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
