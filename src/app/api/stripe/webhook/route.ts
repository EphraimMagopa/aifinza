import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getPlanByPriceId, stripe } from "@/lib/stripe";

function getWebhookSecret(): string {
	const secret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!secret) {
		throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
	}
	return secret;
}

export async function POST(request: Request) {
	const body = await request.text();
	const headersList = await headers();
	const signature = headersList.get("stripe-signature");

	if (!signature) {
		return NextResponse.json({ error: "Missing signature" }, { status: 400 });
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
	} catch (error) {
		console.error("Webhook signature verification failed:", error);
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
	}

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutComplete(session);
				break;
			}

			case "customer.subscription.created":
			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionChange(subscription);
				break;
			}

			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionDeleted(subscription);
				break;
			}

			case "invoice.payment_failed": {
				const invoice = event.data.object as Stripe.Invoice;
				await handlePaymentFailed(invoice);
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("Webhook handler error:", error);
		return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
	}
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
	const userId = session.metadata?.userId;
	if (!userId) {
		console.error("No userId in checkout session metadata");
		return;
	}

	const subscriptionId = session.subscription as string;
	const customerId = session.customer as string;

	// Fetch the full subscription details with items expanded
	const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId, {
		expand: ["items.data"],
	});
	const firstItem = subscriptionResponse.items.data[0];
	const priceId = firstItem?.price.id;
	const plan = getPlanByPriceId(priceId) || "STARTER";
	// In API 2025-11-17.clover, current_period_end is on subscription items
	const currentPeriodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000);

	// Update or create subscription record
	await prisma.subscription.upsert({
		where: { userId },
		update: {
			stripeCustomerId: customerId,
			stripeSubscriptionId: subscriptionId,
			stripePriceId: priceId,
			stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
			plan,
			status: mapStripeStatus(subscriptionResponse.status),
		},
		create: {
			userId,
			stripeCustomerId: customerId,
			stripeSubscriptionId: subscriptionId,
			stripePriceId: priceId,
			stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
			plan,
			status: mapStripeStatus(subscriptionResponse.status),
		},
	});

	console.log(`Subscription created for user ${userId}: ${plan}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
	const userId = subscription.metadata?.userId;
	if (!userId) {
		// Try to find by customer ID
		const existingSub = await prisma.subscription.findFirst({
			where: { stripeSubscriptionId: subscription.id },
		});
		if (!existingSub) {
			console.error("Could not find user for subscription:", subscription.id);
			return;
		}
	}

	const firstItem = subscription.items.data[0];
	const priceId = firstItem?.price.id;
	const plan = getPlanByPriceId(priceId) || "STARTER";
	// In API 2025-11-17.clover, current_period_end is on subscription items
	const currentPeriodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000);

	await prisma.subscription.update({
		where: { stripeSubscriptionId: subscription.id },
		data: {
			stripePriceId: priceId,
			stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
			plan,
			status: mapStripeStatus(subscription.status),
		},
	});

	console.log(`Subscription updated: ${subscription.id} -> ${plan}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	await prisma.subscription.update({
		where: { stripeSubscriptionId: subscription.id },
		data: {
			status: "CANCELLED",
			plan: "FREE",
		},
	});

	console.log(`Subscription cancelled: ${subscription.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
	// In API 2025-11-17.clover, subscription is in parent.subscription_details
	const subscriptionDetails = invoice.parent?.subscription_details;
	const subscriptionId =
		typeof subscriptionDetails?.subscription === "string"
			? subscriptionDetails.subscription
			: subscriptionDetails?.subscription?.id;
	if (!subscriptionId) return;

	await prisma.subscription.update({
		where: { stripeSubscriptionId: subscriptionId },
		data: {
			status: "PAST_DUE",
		},
	});

	console.log(`Payment failed for subscription: ${subscriptionId}`);
}

function mapStripeStatus(
	status: Stripe.Subscription.Status
): "ACTIVE" | "CANCELLED" | "PAST_DUE" | "TRIALING" {
	switch (status) {
		case "active":
			return "ACTIVE";
		case "canceled":
			return "CANCELLED";
		case "past_due":
		case "unpaid":
			return "PAST_DUE";
		case "trialing":
			return "TRIALING";
		default:
			return "ACTIVE";
	}
}
