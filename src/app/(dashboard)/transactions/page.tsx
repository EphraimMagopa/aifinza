"use client";

import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";

interface Transaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	type: "INCOME" | "EXPENSE" | "TRANSFER" | "JOURNAL";
	reference: string | null;
	isReconciled: boolean;
	category: { id: string; name: string; color: string | null } | null;
	bankAccount: { id: string; name: string; bankName: string } | null;
}

interface Category {
	id: string;
	name: string;
}

interface BankAccount {
	id: string;
	name: string;
}

interface Filters {
	type?: string;
	categoryId?: string;
	bankAccountId?: string;
	startDate?: string;
	endDate?: string;
	search?: string;
}

export default function TransactionsPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canCreate = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT", "MEMBER"]);
	const canEdit = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT", "MEMBER"]);
	const canDelete = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filters, setFilters] = useState<Filters>({});
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isCategorizing, setIsCategorizing] = useState(false);

	const fetchData = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);

		try {
			// Build query string
			const params = new URLSearchParams();
			if (filters.type) params.set("type", filters.type);
			if (filters.categoryId) params.set("categoryId", filters.categoryId);
			if (filters.bankAccountId) params.set("bankAccountId", filters.bankAccountId);
			if (filters.startDate) params.set("startDate", filters.startDate);
			if (filters.endDate) params.set("endDate", filters.endDate);
			if (filters.search) params.set("search", filters.search);

			const [transactionsRes, categoriesRes, accountsRes] = await Promise.all([
				fetch(`/api/businesses/${businessId}/transactions?${params}`),
				fetch(`/api/businesses/${businessId}/categories`),
				fetch(`/api/businesses/${businessId}/bank-accounts`),
			]);

			if (transactionsRes.ok) {
				const data = await transactionsRes.json();
				setTransactions(data.transactions || []);
			}

			if (categoriesRes.ok) {
				const data = await categoriesRes.json();
				setCategories(data.categories || []);
			}

			if (accountsRes.ok) {
				const data = await accountsRes.json();
				setBankAccounts(
					(data.accounts || []).filter(
						(a: BankAccount & { isActive?: boolean }) => a.isActive !== false
					)
				);
			}
		} catch (error) {
			console.error("Failed to fetch data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, filters]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	function handleSelectChange(id: string, selected: boolean) {
		if (selected) {
			setSelectedIds([...selectedIds, id]);
		} else {
			setSelectedIds(selectedIds.filter((i) => i !== id));
		}
	}

	function handleSelectAll(selected: boolean) {
		if (selected) {
			setSelectedIds(transactions.map((t) => t.id));
		} else {
			setSelectedIds([]);
		}
	}

	async function handleDelete(id: string) {
		if (!businessId) return;
		if (!confirm("Are you sure you want to delete this transaction?")) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/transactions/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const result = await response.json();
				alert(result.error || "Failed to delete transaction");
				return;
			}

			await fetchData();
			setSelectedIds(selectedIds.filter((i) => i !== id));
		} catch (error) {
			console.error("Delete error:", error);
		}
	}

	async function handleAICategorize() {
		if (!businessId || selectedIds.length === 0) return;

		// Filter to only uncategorized transactions
		const uncategorizedIds = transactions
			.filter((t) => selectedIds.includes(t.id) && !t.category)
			.map((t) => t.id);

		if (uncategorizedIds.length === 0) {
			toast.info("No uncategorized transactions", {
				description: "All selected transactions already have categories.",
			});
			return;
		}

		setIsCategorizing(true);

		try {
			const response = await fetch("/api/ai/categorize", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					businessId,
					transactionIds: uncategorizedIds.slice(0, 50), // Max 50 at a time
				}),
			});

			if (response.ok) {
				const data = await response.json();
				toast.success("Categorization complete", {
					description: `${data.categorized} of ${data.total} transactions categorized.`,
				});
				await fetchData();
				setSelectedIds([]);
			} else {
				const errorData = await response.json();
				toast.error("Categorization failed", {
					description: errorData.error || "Failed to categorize transactions",
				});
			}
		} catch (error) {
			console.error("Categorization error:", error);
			toast.error("Error", {
				description: "An unexpected error occurred",
			});
		} finally {
			setIsCategorizing(false);
		}
	}

	if (businessLoading) {
		return <TransactionsPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to manage transactions.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
					<p className="text-muted-foreground">View and manage your financial transactions</p>
				</div>
				<div className="flex gap-2">
					{selectedIds.length > 0 && (
						<Button variant="outline" onClick={handleAICategorize} disabled={isCategorizing}>
							<Sparkles className="mr-2 h-4 w-4" />
							{isCategorizing ? "Categorizing..." : `AI Categorize (${selectedIds.length})`}
						</Button>
					)}
					<Button variant="outline" asChild>
						<Link href="/transactions/import">Import CSV</Link>
					</Button>
					{canCreate && (
						<Button asChild>
							<Link href="/transactions/new">
								<Plus className="mr-2 h-4 w-4" />
								Add Transaction
							</Link>
						</Button>
					)}
				</div>
			</div>

			{/* Filters */}
			<TransactionFilters
				filters={filters}
				onFiltersChange={setFilters}
				categories={categories}
				bankAccounts={bankAccounts}
			/>

			{/* Transaction Table */}
			<TransactionTable
				transactions={transactions}
				isLoading={isLoading}
				selectedIds={selectedIds}
				onSelectChange={handleSelectChange}
				onSelectAll={handleSelectAll}
				onDelete={handleDelete}
				canEdit={canEdit}
				canDelete={canDelete}
			/>
		</div>
	);
}

function TransactionsPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<div className="h-8 w-40 bg-muted rounded animate-pulse" />
					<div className="h-4 w-64 bg-muted rounded animate-pulse" />
				</div>
				<div className="h-10 w-32 bg-muted rounded animate-pulse" />
			</div>
			<div className="h-10 bg-muted rounded animate-pulse" />
			<div className="h-64 bg-muted rounded animate-pulse" />
		</div>
	);
}
