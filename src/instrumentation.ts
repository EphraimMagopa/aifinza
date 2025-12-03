/**
 * Next.js instrumentation file
 * Called on server startup to initialize monitoring and error tracking
 */
export async function register() {
	// Initialize error tracking on server
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { initErrorTracking } = await import("@/lib/error-tracking");
		initErrorTracking();
	}

	// Edge runtime initialization (if needed)
	if (process.env.NEXT_RUNTIME === "edge") {
		// Edge-specific initialization
	}
}
