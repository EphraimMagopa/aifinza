import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export interface SubscriptionData {
	id: string;
	userId: string;
	plan: SubscriptionPlan;
	status: SubscriptionStatus;
	stripeCustomerId: string | null;
	stripeSubscriptionId: string | null;
	stripePriceId: string | null;
	stripeCurrentPeriodEnd: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface PlanFeatures {
	name: string;
	description: string;
	priceId: string | null | undefined;
	price: number;
	interval: "month" | "year";
	features: string[];
	limits: {
		businesses: number;
		transactionsPerMonth: number;
		teamMembers: number;
		invoicesPerMonth: number;
	};
}

export interface CheckoutSessionResponse {
	sessionId: string;
	url: string;
}

export interface PortalSessionResponse {
	url: string;
}
