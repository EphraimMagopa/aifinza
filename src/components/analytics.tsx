"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Analytics component that includes Vercel Analytics and Speed Insights
 * Only loads in production by default
 */
export function Analytics() {
	return (
		<>
			<VercelAnalytics />
			<SpeedInsights />
		</>
	);
}

/**
 * Track a custom event
 * Use this to track important user actions like:
 * - Creating an invoice
 * - Adding a customer
 * - Completing onboarding
 * - Subscription changes
 */
export { track } from "@vercel/analytics";
