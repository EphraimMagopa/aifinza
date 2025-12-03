import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STRIPE_PLANS } from "@/lib/stripe";

// GET /api/user/subscription - Get current user's subscription
export async function GET() {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const subscription = await prisma.subscription.findUnique({
			where: { userId: session.user.id },
		});

		if (!subscription) {
			// Return free plan for users without subscription
			return NextResponse.json({
				subscription: {
					plan: "FREE",
					status: "ACTIVE",
					features: STRIPE_PLANS.FREE.features,
					limits: STRIPE_PLANS.FREE.limits,
					currentPeriodEnd: null,
					cancelAtPeriodEnd: false,
				},
			});
		}

		const planKey = subscription.plan as keyof typeof STRIPE_PLANS;
		const planData = STRIPE_PLANS[planKey] || STRIPE_PLANS.FREE;

		return NextResponse.json({
			subscription: {
				id: subscription.id,
				plan: subscription.plan,
				status: subscription.status,
				features: planData.features,
				limits: planData.limits,
				currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
				cancelAtPeriodEnd: false, // TODO: Fetch from Stripe if needed
			},
		});
	} catch (error) {
		console.error("Get subscription error:", error);
		return NextResponse.json({ error: "Failed to get subscription" }, { status: 500 });
	}
}
