"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	type: "INCOME" | "EXPENSE" | "TRANSFER" | "JOURNAL";
	isReconciled: boolean;
	category: { name: string } | null;
}

interface BankAccount {
	id: string;
	name: string;
	bankName: string;
	currentBalance: number;
}

export default function ReconcilePage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canReconcile = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [selectedAccount, setSelectedAccount] = useState<string>("");
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [statementBalance, setStatementBalance] = useState<string>("");
	const [statementDate, setStatementDate] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);
	const [isReconciling, setIsReconciling] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const fetchBankAccounts = useCallback(async () => {
		if (!businessId) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/bank-accounts`);
			if (response.ok) {
				const data = await response.json();
				setBankAccounts(
					(data.bankAccounts || []).filter(
						(a: BankAccount & { isActive?: boolean }) => a.isActive !== false
					)
				);
			}
		} catch (err) {
			console.error("Failed to fetch bank accounts:", err);
		}
	}, [businessId]);

	const fetchTransactions = useCallback(async () => {
		if (!businessId || !selectedAccount) {
			setTransactions([]);
			return;
		}

		setIsLoading(true);
		try {
			const params = new URLSearchParams({
				bankAccountId: selectedAccount,
				reconciled: "false", // Only get unreconciled transactions
			});

			const response = await fetch(`/api/businesses/${businessId}/transactions?${params}`);
			if (response.ok) {
				const data = await response.json();
				setTransactions(data.transactions || []);
			}
		} catch (err) {
			console.error("Failed to fetch transactions:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, selectedAccount]);

	useEffect(() => {
		fetchBankAccounts();
	}, [fetchBankAccounts]);

	useEffect(() => {
		fetchTransactions();
		setSelectedIds([]);
	}, [fetchTransactions]);

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

	async function handleReconcile() {
		if (!businessId || !selectedAccount || selectedIds.length === 0) return;

		setIsReconciling(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch(`/api/businesses/${businessId}/transactions/reconcile`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					transactionIds: selectedIds,
					bankAccountId: selectedAccount,
					statementBalance: statementBalance || undefined,
					statementDate: statementDate || undefined,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Reconciliation failed");
			}

			setSuccess(`Successfully reconciled ${result.reconciled} transactions`);
			setSelectedIds([]);
			await fetchTransactions();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Reconciliation failed");
		} finally {
			setIsReconciling(false);
		}
	}

	// Calculate totals
	const selectedTransactions = transactions.filter((t) => selectedIds.includes(t.id));
	const selectedTotal = selectedTransactions.reduce((sum, t) => {
		const amount = t.type === "INCOME" ? t.amount : -t.amount;
		return sum + amount;
	}, 0);

	const selectedAccount$ = bankAccounts.find((a) => a.id === selectedAccount);
	const difference = statementBalance
		? Number.parseFloat(statementBalance) - (selectedAccount$?.currentBalance || 0) - selectedTotal
		: null;

	if (businessLoading) {
		return <ReconcilePageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to reconcile transactions.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	if (!canReconcile) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<XCircle className="h-12 w-12 text-muted-foreground mb-4" />
				<h2 className="text-xl font-semibold mb-2">Access Denied</h2>
				<p className="text-muted-foreground">
					You don't have permission to reconcile transactions.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Reconcile Transactions</h1>
				<p className="text-muted-foreground">Match your transactions against your bank statement</p>
			</div>

			{/* Account Selection and Statement Info */}
			<Card>
				<CardHeader>
					<CardTitle>Reconciliation Setup</CardTitle>
					<CardDescription>Select a bank account and enter your statement details</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div className="space-y-2">
							<Label>Bank Account</Label>
							<Select value={selectedAccount} onValueChange={setSelectedAccount}>
								<SelectTrigger>
									<SelectValue placeholder="Select account" />
								</SelectTrigger>
								<SelectContent>
									{bankAccounts.map((account) => (
										<SelectItem key={account.id} value={account.id}>
											{account.name} ({account.bankName})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="statement-balance">Statement Balance</Label>
							<Input
								id="statement-balance"
								type="number"
								step="0.01"
								placeholder="0.00"
								value={statementBalance}
								onChange={(e) => setStatementBalance(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="statement-date">Statement Date</Label>
							<Input
								id="statement-date"
								type="date"
								value={statementDate}
								onChange={(e) => setStatementDate(e.target.value)}
							/>
						</div>

						{selectedAccount$ && (
							<div className="space-y-2">
								<Label>Current Balance</Label>
								<div className="h-10 flex items-center text-lg font-semibold">
									{formatCurrency(selectedAccount$.currentBalance)}
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Alerts */}
			{error && (
				<Alert variant="destructive">
					<XCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{success && (
				<Alert>
					<CheckCircle2 className="h-4 w-4" />
					<AlertTitle>Success</AlertTitle>
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}

			{/* Transaction List */}
			{selectedAccount && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Unreconciled Transactions</CardTitle>
								<CardDescription>
									{transactions.length} transactions • {selectedIds.length} selected
								</CardDescription>
							</div>
							<div className="flex items-center gap-4">
								{difference !== null && (
									<div className="text-right">
										<p className="text-sm text-muted-foreground">Difference</p>
										<p
											className={cn(
												"text-lg font-semibold",
												Math.abs(difference) < 0.01 ? "text-green-600" : "text-red-600"
											)}
										>
											{formatCurrency(difference)}
										</p>
									</div>
								)}
								<Button
									onClick={handleReconcile}
									disabled={selectedIds.length === 0 || isReconciling}
								>
									{isReconciling
										? "Reconciling..."
										: `Reconcile ${selectedIds.length} Transaction${selectedIds.length !== 1 ? "s" : ""}`}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<TransactionTableSkeleton />
						) : transactions.length === 0 ? (
							<div className="text-center py-8">
								<CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
								<p className="font-medium">All transactions are reconciled!</p>
								<p className="text-sm text-muted-foreground">
									There are no unreconciled transactions for this account.
								</p>
							</div>
						) : (
							<div className="rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[40px]">
												<Checkbox
													checked={
														selectedIds.length === transactions.length
															? true
															: selectedIds.length > 0
																? "indeterminate"
																: false
													}
													onCheckedChange={handleSelectAll}
													aria-label="Select all"
												/>
											</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Description</TableHead>
											<TableHead>Category</TableHead>
											<TableHead className="text-right">Amount</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{transactions.map((transaction) => (
											<TableRow
												key={transaction.id}
												className={cn(selectedIds.includes(transaction.id) && "bg-muted/50")}
											>
												<TableCell>
													<Checkbox
														checked={selectedIds.includes(transaction.id)}
														onCheckedChange={(checked) =>
															handleSelectChange(transaction.id, checked === true)
														}
														aria-label={`Select ${transaction.description}`}
													/>
												</TableCell>
												<TableCell className="whitespace-nowrap">
													{formatDate(new Date(transaction.date), {
														day: "2-digit",
														month: "short",
													})}
												</TableCell>
												<TableCell className="max-w-xs truncate">
													{transaction.description}
												</TableCell>
												<TableCell>
													{transaction.category ? (
														<Badge variant="secondary">{transaction.category.name}</Badge>
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</TableCell>
												<TableCell className="text-right">
													<span
														className={cn(
															"font-medium",
															transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
														)}
													>
														{transaction.type === "INCOME" ? "+" : "-"}
														{formatCurrency(transaction.amount)}
													</span>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}

						{/* Summary */}
						{selectedIds.length > 0 && (
							<div className="mt-4 p-4 bg-muted/50 rounded-lg">
								<div className="flex justify-between items-center">
									<span className="font-medium">Selected Total:</span>
									<span
										className={cn(
											"text-lg font-semibold",
											selectedTotal >= 0 ? "text-green-600" : "text-red-600"
										)}
									>
										{formatCurrency(selectedTotal)}
									</span>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function TransactionTableSkeleton() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={`row-${i}`} className="h-12 w-full" />
			))}
		</div>
	);
}

function ReconcilePageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-96" />
			</div>
			<Skeleton className="h-32 rounded-lg" />
			<Skeleton className="h-64 rounded-lg" />
		</div>
	);
}
