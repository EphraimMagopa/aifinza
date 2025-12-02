"use client";

import Link from "next/link";
import { AccountForm } from "@/components/accounts/account-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";

export default function NewAccountPage() {
	const { businessId, isLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();

	if (isLoading) {
		return (
			<div className="max-w-2xl mx-auto space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-96 rounded-lg" />
			</div>
		);
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">Create or select a business first.</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	if (!hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"])) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">Access Denied</h2>
				<p className="text-muted-foreground mb-4">
					You don&apos;t have permission to add bank accounts.
				</p>
				<Button asChild variant="outline">
					<Link href="/accounts">Back to Accounts</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto">
			<AccountForm />
		</div>
	);
}
