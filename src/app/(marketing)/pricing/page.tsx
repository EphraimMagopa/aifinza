"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatPrice, type PlanKey, STRIPE_PLANS } from "@/lib/stripe";

const planOrder: PlanKey[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

export default function PricingPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState<PlanKey | null>(null);
	const [currentPlan, setCurrentPlan] = useState<PlanKey>("FREE");

	useEffect(() => {
		if (searchParams.get("canceled") === "true") {
			toast.info("Checkout canceled", {
				description: "You can upgrade anytime from your settings.",
			});
		}
	}, [searchParams]);

	useEffect(() => {
		// Fetch current subscription
		async function fetchSubscription() {
			try {
				const res = await fetch("/api/user/subscription");
				if (res.ok) {
					const data = await res.json();
					setCurrentPlan(data.subscription.plan as PlanKey);
				}
			} catch {
				// User not logged in, stay on FREE
			}
		}
		fetchSubscription();
	}, []);

	async function handleSubscribe(plan: PlanKey) {
		if (plan === "FREE") return;

		setIsLoading(plan);

		try {
			const res = await fetch("/api/stripe/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ plan }),
			});

			if (res.status === 401) {
				// User not logged in
				router.push("/signin?callbackUrl=/pricing");
				return;
			}

			if (!res.ok) {
				const error = await res.json();
				toast.error("Checkout failed", {
					description: error.error || "Could not start checkout",
				});
				return;
			}

			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			}
		} catch (error) {
			console.error("Checkout error:", error);
			toast.error("Error", {
				description: "An unexpected error occurred",
			});
		} finally {
			setIsLoading(null);
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-16">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Choose the plan that fits your business. All plans include access to core features.
						Upgrade anytime as you grow.
					</p>
				</div>

				{/* Pricing Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
					{planOrder.map((key) => {
						const plan = STRIPE_PLANS[key];
						const isCurrentPlan = currentPlan === key;
						const isPopular = key === "PROFESSIONAL";

						return (
							<Card
								key={key}
								className={`relative flex flex-col ${
									isPopular ? "border-primary shadow-lg scale-105" : ""
								}`}
							>
								{isPopular && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2">
										<span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
											Most Popular
										</span>
									</div>
								)}

								<CardHeader>
									<CardTitle className="text-xl">{plan.name}</CardTitle>
									<CardDescription>{plan.description}</CardDescription>
								</CardHeader>

								<CardContent className="flex-1">
									<div className="mb-6">
										<span className="text-4xl font-bold">
											{plan.price === 0 ? "Free" : formatPrice(plan.price)}
										</span>
										{plan.price > 0 && (
											<span className="text-muted-foreground">/{plan.interval}</span>
										)}
									</div>

									<ul className="space-y-3">
										{plan.features.map((feature) => (
											<li key={feature} className="flex items-start gap-2">
												<Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
												<span className="text-sm">{feature}</span>
											</li>
										))}
									</ul>
								</CardContent>

								<CardFooter>
									{isCurrentPlan ? (
										<Button variant="outline" className="w-full" disabled>
											Current Plan
										</Button>
									) : key === "FREE" ? (
										<Button variant="outline" className="w-full" asChild>
											<Link href="/signin">Get Started</Link>
										</Button>
									) : (
										<Button
											className="w-full"
											variant={isPopular ? "default" : "outline"}
											onClick={() => handleSubscribe(key)}
											disabled={isLoading !== null}
										>
											{isLoading === key ? "Loading..." : "Subscribe"}
										</Button>
									)}
								</CardFooter>
							</Card>
						);
					})}
				</div>

				{/* FAQ Section */}
				<div className="mt-20 max-w-3xl mx-auto">
					<h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

					<div className="space-y-6">
						<div>
							<h3 className="font-semibold mb-2">Can I change plans later?</h3>
							<p className="text-muted-foreground">
								Yes! You can upgrade or downgrade your plan at any time from your account settings.
								Changes take effect immediately.
							</p>
						</div>

						<div>
							<h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
							<p className="text-muted-foreground">
								We accept all major credit and debit cards through our secure payment processor,
								Stripe.
							</p>
						</div>

						<div>
							<h3 className="font-semibold mb-2">Is there a free trial?</h3>
							<p className="text-muted-foreground">
								Yes! Our Free plan lets you explore the platform with basic features. When
								you&apos;re ready, upgrade to unlock more capabilities.
							</p>
						</div>

						<div>
							<h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
							<p className="text-muted-foreground">
								Absolutely. You can cancel your subscription at any time, and you&apos;ll retain
								access until the end of your billing period.
							</p>
						</div>

						<div>
							<h3 className="font-semibold mb-2">Do you offer refunds?</h3>
							<p className="text-muted-foreground">
								We offer a 30-day money-back guarantee. If you&apos;re not satisfied, contact our
								support team for a full refund.
							</p>
						</div>
					</div>
				</div>

				{/* CTA */}
				<div className="mt-16 text-center">
					<p className="text-muted-foreground mb-4">Have questions? We&apos;re here to help.</p>
					<Button variant="outline" asChild>
						<Link href="/contact">Contact Sales</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
