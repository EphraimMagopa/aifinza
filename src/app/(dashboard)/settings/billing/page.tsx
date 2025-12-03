"use client";

import { format } from "date-fns";
import { Check, CreditCard, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, type PlanKey, STRIPE_PLANS } from "@/lib/stripe";

interface SubscriptionData {
	id?: string;
	plan: PlanKey;
	status: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "TRIALING";
	features: string[];
	limits: {
		businesses: number;
		transactionsPerMonth: number;
		teamMembers: number;
		invoicesPerMonth: number;
	};
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
	const searchParams = useSearchParams();
	const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPortalLoading, setIsPortalLoading] = useState(false);

	const fetchSubscription = useCallback(async () => {
		try {
			const res = await fetch("/api/user/subscription");
			if (res.ok) {
				const data = await res.json();
				setSubscription(data.subscription);
			}
		} catch (error) {
			console.error("Failed to fetch subscription:", error);
			toast.error("Failed to load subscription");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSubscription();
	}, [fetchSubscription]);

	useEffect(() => {
		if (searchParams.get("success") === "true") {
			toast.success("Subscription activated!", {
				description: "Thank you for subscribing to Aifinza.",
			});
			fetchSubscription();
		}
	}, [searchParams, fetchSubscription]);

	async function handleManageBilling() {
		setIsPortalLoading(true);

		try {
			const res = await fetch("/api/stripe/portal", {
				method: "POST",
			});

			if (!res.ok) {
				const error = await res.json();
				toast.error("Error", {
					description: error.error || "Could not open billing portal",
				});
				return;
			}

			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			}
		} catch (error) {
			console.error("Portal error:", error);
			toast.error("Error", {
				description: "An unexpected error occurred",
			});
		} finally {
			setIsPortalLoading(false);
		}
	}

	if (isLoading) {
		return <BillingSkeleton />;
	}

	const planData = subscription ? STRIPE_PLANS[subscription.plan] : STRIPE_PLANS.FREE;
	const isPaidPlan = subscription && subscription.plan !== "FREE";

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
				<p className="text-muted-foreground">Manage your subscription and billing settings</p>
			</div>

			{/* Current Plan */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Current Plan</CardTitle>
							<CardDescription>
								You are currently on the <span className="font-semibold">{planData.name}</span> plan
							</CardDescription>
						</div>
						<div className="text-right">
							<div className="text-2xl font-bold">
								{planData.price === 0 ? "Free" : formatPrice(planData.price)}
							</div>
							{planData.price > 0 && <div className="text-sm text-muted-foreground">/month</div>}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* Status */}
						{subscription && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">Status:</span>
								<span
									className={`text-sm font-medium ${
										subscription.status === "ACTIVE"
											? "text-green-600"
											: subscription.status === "PAST_DUE"
												? "text-yellow-600"
												: "text-red-600"
									}`}
								>
									{subscription.status}
								</span>
							</div>
						)}

						{/* Renewal Date */}
						{subscription?.currentPeriodEnd && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									{subscription.cancelAtPeriodEnd ? "Access until:" : "Renews on:"}
								</span>
								<span className="text-sm font-medium">
									{format(new Date(subscription.currentPeriodEnd), "MMMM d, yyyy")}
								</span>
							</div>
						)}

						{/* Features */}
						<div className="pt-4">
							<h4 className="text-sm font-medium mb-3">Plan Features</h4>
							<ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
								{planData.features.map((feature) => (
									<li key={feature} className="flex items-center gap-2 text-sm">
										<Check className="h-4 w-4 text-primary" />
										{feature}
									</li>
								))}
							</ul>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex flex-wrap gap-4">
					{isPaidPlan ? (
						<Button onClick={handleManageBilling} disabled={isPortalLoading}>
							<CreditCard className="mr-2 h-4 w-4" />
							{isPortalLoading ? "Loading..." : "Manage Billing"}
						</Button>
					) : (
						<Button asChild>
							<Link href="/pricing">
								Upgrade Plan
								<ExternalLink className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					)}
				</CardFooter>
			</Card>

			{/* Usage */}
			<Card>
				<CardHeader>
					<CardTitle>Usage</CardTitle>
					<CardDescription>Your current usage this billing period</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<UsageCard
							title="Businesses"
							current={1}
							limit={subscription?.limits.businesses ?? 1}
						/>
						<UsageCard
							title="Transactions"
							current={0}
							limit={subscription?.limits.transactionsPerMonth ?? 50}
						/>
						<UsageCard
							title="Team Members"
							current={1}
							limit={subscription?.limits.teamMembers ?? 1}
						/>
						<UsageCard
							title="Invoices"
							current={0}
							limit={subscription?.limits.invoicesPerMonth ?? 5}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Upgrade Prompt for Free Users */}
			{!isPaidPlan && (
				<Card className="border-primary/50 bg-primary/5">
					<CardContent className="pt-6">
						<div className="flex items-start gap-4">
							<div className="flex-1">
								<h3 className="font-semibold mb-1">Unlock more with a paid plan</h3>
								<p className="text-sm text-muted-foreground mb-4">
									Get unlimited transactions, AI-powered features, and advanced tax compliance
									tools.
								</p>
								<Button asChild>
									<Link href="/pricing">View Plans</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function UsageCard({ title, current, limit }: { title: string; current: number; limit: number }) {
	const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
	const isUnlimited = limit === -1;

	return (
		<div className="rounded-lg border p-4">
			<div className="text-sm text-muted-foreground mb-1">{title}</div>
			<div className="text-2xl font-bold">
				{current}
				<span className="text-sm font-normal text-muted-foreground">
					{isUnlimited ? " / ∞" : ` / ${limit}`}
				</span>
			</div>
			{!isUnlimited && (
				<div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
					<div
						className={`h-full rounded-full ${
							percentage >= 90
								? "bg-destructive"
								: percentage >= 70
									? "bg-yellow-500"
									: "bg-primary"
						}`}
						style={{ width: `${percentage}%` }}
					/>
				</div>
			)}
		</div>
	);
}

function BillingSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-8 w-64 mb-2" />
				<Skeleton className="h-4 w-96" />
			</div>
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32 mb-2" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
