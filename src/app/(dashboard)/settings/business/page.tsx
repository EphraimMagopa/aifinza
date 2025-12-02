"use client";

import Link from "next/link";
import { BusinessForm } from "@/components/settings/business-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness } from "@/hooks/use-business";

export default function BusinessSettingsPage() {
	const { businessId, isLoading } = useBusiness();

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96 mt-2" />
				</div>
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to manage settings.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
				<p className="text-muted-foreground">
					Update your business details, contact information, and tax settings.
				</p>
			</div>

			<BusinessForm />
		</div>
	);
}
