import Stripe from "stripe";

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-11-17.clover",
	typescript: true,
});

// Plan pricing IDs (these should match your Stripe dashboard)
export const STRIPE_PLANS = {
	FREE: {
		name: "Free",
		description: "For individuals getting started",
		priceId: null, // Free plan doesn't need a price ID
		price: 0,
		interval: "month" as const,
		features: ["1 business", "50 transactions/month", "Basic reports", "Email support"],
		limits: {
			businesses: 1,
			transactionsPerMonth: 50,
			teamMembers: 1,
			invoicesPerMonth: 5,
		},
	},
	STARTER: {
		name: "Starter",
		description: "For small businesses",
		priceId: process.env.STRIPE_STARTER_PRICE_ID,
		price: 199,
		interval: "month" as const,
		features: [
			"1 business",
			"500 transactions/month",
			"Full reports",
			"Invoice generation",
			"Bank CSV import",
			"Priority support",
		],
		limits: {
			businesses: 1,
			transactionsPerMonth: 500,
			teamMembers: 2,
			invoicesPerMonth: 50,
		},
	},
	PROFESSIONAL: {
		name: "Professional",
		description: "For growing businesses",
		priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
		price: 499,
		interval: "month" as const,
		features: [
			"3 businesses",
			"Unlimited transactions",
			"AI-powered categorization",
			"AI financial assistant",
			"Payroll management",
			"Tax compliance tools",
			"5 team members",
			"Phone support",
		],
		limits: {
			businesses: 3,
			transactionsPerMonth: -1, // unlimited
			teamMembers: 5,
			invoicesPerMonth: -1, // unlimited
		},
	},
	ENTERPRISE: {
		name: "Enterprise",
		description: "For large organizations",
		priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
		price: 999,
		interval: "month" as const,
		features: [
			"Unlimited businesses",
			"Unlimited transactions",
			"All AI features",
			"Advanced analytics",
			"Custom integrations",
			"Unlimited team members",
			"Dedicated account manager",
			"SLA guarantee",
		],
		limits: {
			businesses: -1, // unlimited
			transactionsPerMonth: -1,
			teamMembers: -1,
			invoicesPerMonth: -1,
		},
	},
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

// Get plan by Stripe price ID
export function getPlanByPriceId(priceId: string): PlanKey | null {
	for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
		if (plan.priceId === priceId) {
			return key as PlanKey;
		}
	}
	return null;
}

// Create Stripe checkout session
export async function createCheckoutSession({
	userId,
	userEmail,
	priceId,
	successUrl,
	cancelUrl,
	customerId,
}: {
	userId: string;
	userEmail: string;
	priceId: string;
	successUrl: string;
	cancelUrl: string;
	customerId?: string;
}) {
	const session = await stripe.checkout.sessions.create({
		customer: customerId,
		customer_email: customerId ? undefined : userEmail,
		mode: "subscription",
		payment_method_types: ["card"],
		line_items: [
			{
				price: priceId,
				quantity: 1,
			},
		],
		success_url: successUrl,
		cancel_url: cancelUrl,
		metadata: {
			userId,
		},
		subscription_data: {
			metadata: {
				userId,
			},
		},
		allow_promotion_codes: true,
	});

	return session;
}

// Create Stripe customer portal session
export async function createPortalSession({
	customerId,
	returnUrl,
}: {
	customerId: string;
	returnUrl: string;
}) {
	const session = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: returnUrl,
	});

	return session;
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
	return stripe.subscriptions.update(subscriptionId, {
		cancel_at_period_end: true,
	});
}

// Reactivate subscription
export async function reactivateSubscription(subscriptionId: string) {
	return stripe.subscriptions.update(subscriptionId, {
		cancel_at_period_end: false,
	});
}

// Get subscription
export async function getSubscription(subscriptionId: string) {
	return stripe.subscriptions.retrieve(subscriptionId);
}

// Format price for display (ZAR)
export function formatPrice(amount: number): string {
	return new Intl.NumberFormat("en-ZA", {
		style: "currency",
		currency: "ZAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}
