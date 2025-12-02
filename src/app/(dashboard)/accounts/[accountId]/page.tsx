"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AccountForm } from "@/components/accounts/account-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";

interface BankAccount {
	id: string;
	name: string;
	bankName: string;
	accountNumber: string;
	branchCode: string | null;
	accountType: string;
	currentBalance: number;
	currency: string;
	isActive: boolean;
}

export default function EditAccountPage() {
	const params = useParams();
	const router = useRouter();
	const accountId = params.accountId as string;

	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();

	const [account, setAccount] = useState<BankAccount | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAccount = useCallback(async () => {
		if (!businessId || !accountId) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/businesses/${businessId}/bank-accounts/${accountId}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("Account not found");
				}
				throw new Error("Failed to fetch account");
			}
			const data = await response.json();
			setAccount(data.account);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	}, [businessId, accountId]);

	useEffect(() => {
		fetchAccount();
	}, [fetchAccount]);

	if (businessLoading || isLoading) {
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

	if (error || !account) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">Account Not Found</h2>
				<p className="text-muted-foreground mb-4">{error || "The account could not be loaded."}</p>
				<Button asChild variant="outline">
					<Link href="/accounts">Back to Accounts</Link>
				</Button>
			</div>
		);
	}

	if (!hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"])) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">Access Denied</h2>
				<p className="text-muted-foreground mb-4">
					You don&apos;t have permission to edit bank accounts.
				</p>
				<Button asChild variant="outline">
					<Link href="/accounts">Back to Accounts</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto">
			<AccountForm
				accountId={accountId}
				defaultValues={{
					name: account.name,
					bankName: account.bankName,
					accountNumber: account.accountNumber,
					branchCode: account.branchCode || "",
					accountType: account.accountType as
						| "CURRENT"
						| "SAVINGS"
						| "CREDIT_CARD"
						| "LOAN"
						| "CASH"
						| "OTHER",
					currency: account.currency,
				}}
				onSuccess={() => router.push("/accounts")}
			/>
		</div>
	);
}
