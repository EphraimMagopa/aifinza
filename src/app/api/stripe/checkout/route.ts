import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession, type PlanKey, STRIPE_PLANS } from "@/lib/stripe";
import { createCheckoutSchema } from "@/lib/validations/subscription";

export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const parsed = createCheckoutSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { plan } = parsed.data;
		const planData = STRIPE_PLANS[plan as PlanKey];

		if (!planData.priceId) {
			return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
		}

		// Get or create subscription record
		const subscription = await prisma.subscription.findUnique({
			where: { userId: session.user.id },
		});

		// Get base URL
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3694";

		const checkoutSession = await createCheckoutSession({
			userId: session.user.id,
			userEmail: session.user.email!,
			priceId: planData.priceId,
			successUrl: `${baseUrl}/settings/billing?success=true`,
			cancelUrl: `${baseUrl}/pricing?canceled=true`,
			customerId: subscription?.stripeCustomerId || undefined,
		});

		return NextResponse.json({
			sessionId: checkoutSession.id,
			url: checkoutSession.url,
		});
	} catch (error) {
		console.error("Checkout error:", error);
		return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
	}
}
