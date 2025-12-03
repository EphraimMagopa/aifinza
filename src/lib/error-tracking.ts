import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.GLITCHTIP_DSN;

let isInitialized = false;

/**
 * Initialize error tracking (Sentry/GlitchTip)
 * Call this in instrumentation.ts or at app startup
 */
export function initErrorTracking() {
	if (isInitialized || !SENTRY_DSN) {
		return;
	}

	Sentry.init({
		dsn: SENTRY_DSN,
		environment: process.env.NODE_ENV,

		// Performance monitoring
		tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

		// Session replay (disabled by default)
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,

		// Only send errors in production (or if explicitly enabled)
		enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLED === "true",

		// Ignore common non-actionable errors
		ignoreErrors: [
			// Browser extensions
			"top.GLOBALS",
			"originalCreateNotification",
			"canvas.contentDocument",
			"MyApp_RemoveAllHighlights",
			"http://tt.telecentre.in",
			"jigsaw is not defined",
			// Network errors
			"Failed to fetch",
			"NetworkError",
			"Load failed",
			// User actions
			"ResizeObserver loop",
			"Non-Error promise rejection",
		],

		// Filter out sensitive data
		beforeSend(event) {
			// Remove sensitive headers
			if (event.request?.headers) {
				delete event.request.headers.cookie;
				delete event.request.headers.authorization;
			}
			return event;
		},
	});

	isInitialized = true;
}

/**
 * Capture an exception with optional context
 */
export function captureException(
	error: Error | unknown,
	context?: {
		userId?: string;
		businessId?: string;
		extra?: Record<string, unknown>;
		tags?: Record<string, string>;
	}
) {
	if (!SENTRY_DSN) {
		console.error("Error captured (Sentry not configured):", error);
		return;
	}

	Sentry.withScope((scope) => {
		if (context?.userId) {
			scope.setUser({ id: context.userId });
		}
		if (context?.businessId) {
			scope.setTag("businessId", context.businessId);
		}
		if (context?.tags) {
			for (const [key, value] of Object.entries(context.tags)) {
				scope.setTag(key, value);
			}
		}
		if (context?.extra) {
			for (const [key, value] of Object.entries(context.extra)) {
				scope.setExtra(key, value);
			}
		}
		Sentry.captureException(error);
	});
}

/**
 * Capture a message with severity level
 */
export function captureMessage(
	message: string,
	level: "info" | "warning" | "error" = "info",
	context?: {
		userId?: string;
		businessId?: string;
		extra?: Record<string, unknown>;
	}
) {
	if (!SENTRY_DSN) {
		console.log(`[${level.toUpperCase()}] ${message}`, context?.extra);
		return;
	}

	Sentry.withScope((scope) => {
		if (context?.userId) {
			scope.setUser({ id: context.userId });
		}
		if (context?.businessId) {
			scope.setTag("businessId", context.businessId);
		}
		if (context?.extra) {
			for (const [key, value] of Object.entries(context.extra)) {
				scope.setExtra(key, value);
			}
		}
		Sentry.captureMessage(message, level);
	});
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; name?: string } | null) {
	if (!SENTRY_DSN) return;

	if (user) {
		Sentry.setUser({
			id: user.id,
			email: user.email,
			username: user.name,
		});
	} else {
		Sentry.setUser(null);
	}
}

/**
 * Add breadcrumb for error context
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
	if (!SENTRY_DSN) return;

	Sentry.addBreadcrumb({
		message,
		category,
		data,
		level: "info",
	});
}

// Re-export Sentry for advanced usage
export { Sentry };
