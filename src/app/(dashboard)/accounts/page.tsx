"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AccountCard } from "@/components/accounts/account-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import { formatCurrency } from "@/lib/utils";

interface BankAccount {
	id: string;
	name: string;
	bankName: string;
	accountNumber: string;
	accountType: string;
	currentBalance: number;
	isActive: boolean;
	currency: string;
}

export default function AccountsPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManageAccounts = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [accounts, setAccounts] = useState<BankAccount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAccounts = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/businesses/${businessId}/bank-accounts`);
			if (!response.ok) {
				throw new Error("Failed to fetch accounts");
			}
			const data = await response.json();
			setAccounts(data.accounts || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

	async function handleToggleActive(accountId: string, isActive: boolean) {
		if (!businessId) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/bank-accounts/${accountId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive }),
			});

			if (!response.ok) {
				throw new Error("Failed to update account");
			}

			await fetchAccounts();
		} catch (err) {
			console.error("Toggle active error:", err);
		}
	}

	async function handleDelete(accountId: string) {
		if (!businessId) return;
		if (!confirm("Are you sure you want to delete this account?")) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/bank-accounts/${accountId}`, {
				method: "DELETE",
			});

			const result = await response.json();

			if (!response.ok) {
				alert(result.error || "Failed to delete account");
				return;
			}

			await fetchAccounts();
		} catch (err) {
			console.error("Delete error:", err);
		}
	}

	if (businessLoading) {
		return <AccountsPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to manage accounts.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	const activeAccounts = accounts.filter((a) => a.isActive);
	const inactiveAccounts = accounts.filter((a) => !a.isActive);
	const totalBalance = activeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
					<p className="text-muted-foreground">
						Manage your connected bank accounts and track balances
					</p>
				</div>
				{canManageAccounts && (
					<Button asChild>
						<Link href="/accounts/new">
							<Plus className="mr-2 h-4 w-4" />
							Add Account
						</Link>
					</Button>
				)}
			</div>

			{/* Summary */}
			{accounts.length > 0 && (
				<div className="rounded-lg border bg-card p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Total Balance (Active Accounts)</p>
							<p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
						</div>
						<div className="text-right text-muted-foreground">
							<p>{activeAccounts.length} active accounts</p>
							{inactiveAccounts.length > 0 && <p>{inactiveAccounts.length} inactive</p>}
						</div>
					</div>
				</div>
			)}

			{/* Error state */}
			{error && (
				<div className="rounded-md bg-destructive/10 p-4 text-destructive">
					{error}
					<Button variant="link" className="ml-2" onClick={fetchAccounts}>
						Retry
					</Button>
				</div>
			)}

			{/* Loading state */}
			{isLoading && <AccountsPageSkeleton showHeaderOnly />}

			{/* Empty state */}
			{!isLoading && accounts.length === 0 && (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
					<h3 className="text-lg font-medium">No bank accounts yet</h3>
					<p className="text-muted-foreground mb-4">
						Add your first bank account to start tracking your finances.
					</p>
					{canManageAccounts && (
						<Button asChild>
							<Link href="/accounts/new">
								<Plus className="mr-2 h-4 w-4" />
								Add Bank Account
							</Link>
						</Button>
					)}
				</div>
			)}

			{/* Active accounts */}
			{!isLoading && activeAccounts.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{activeAccounts.map((account) => (
						<AccountCard
							key={account.id}
							account={account}
							onToggleActive={canManageAccounts ? handleToggleActive : undefined}
							onDelete={hasPermission(["OWNER", "ADMIN"]) ? handleDelete : undefined}
						/>
					))}
				</div>
			)}

			{/* Inactive accounts */}
			{!isLoading && inactiveAccounts.length > 0 && (
				<div>
					<h2 className="text-lg font-medium mb-4">Inactive Accounts</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{inactiveAccounts.map((account) => (
							<AccountCard
								key={account.id}
								account={account}
								onToggleActive={canManageAccounts ? handleToggleActive : undefined}
								onDelete={hasPermission(["OWNER", "ADMIN"]) ? handleDelete : undefined}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function AccountsPageSkeleton({ showHeaderOnly = false }: { showHeaderOnly?: boolean }) {
	if (showHeaderOnly) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
					<Skeleton key={`skeleton-${i}`} className="h-48 rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>
			<Skeleton className="h-24 rounded-lg" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Skeleton className="h-48 rounded-lg" />
				<Skeleton className="h-48 rounded-lg" />
			</div>
		</div>
	);
}
