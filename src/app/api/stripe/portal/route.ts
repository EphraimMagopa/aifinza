import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPortalSession } from "@/lib/stripe";

export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user's subscription
		const subscription = await prisma.subscription.findUnique({
			where: { userId: session.user.id },
		});

		if (!subscription?.stripeCustomerId) {
			return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
		}

		// Get base URL
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3694";

		const portalSession = await createPortalSession({
			customerId: subscription.stripeCustomerId,
			returnUrl: `${baseUrl}/settings/billing`,
		});

		return NextResponse.json({
			url: portalSession.url,
		});
	} catch (error) {
		console.error("Portal session error:", error);
		return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
	}
}
