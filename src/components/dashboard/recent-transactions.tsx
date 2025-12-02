"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
	id: string;
	description: string;
	amount: number;
	type: "INCOME" | "EXPENSE" | "TRANSFER" | "JOURNAL";
	date: string;
	category?: {
		name: string;
		color?: string;
	} | null;
}

interface RecentTransactionsProps {
	transactions: Transaction[];
	isLoading?: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Transactions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<TransactionSkeleton key={`skeleton-${i}`} />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Recent Transactions</CardTitle>
				<Link href="/transactions" className="text-sm text-muted-foreground hover:text-foreground">
					View all
				</Link>
			</CardHeader>
			<CardContent>
				{transactions.length === 0 ? (
					<div className="text-center py-6 text-muted-foreground">
						No transactions yet.{" "}
						<Link href="/transactions/new" className="text-primary underline">
							Create your first transaction
						</Link>
					</div>
				) : (
					<div className="space-y-4">
						{transactions.map((transaction) => (
							<TransactionRow key={transaction.id} transaction={transaction} />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
	const isIncome = transaction.type === "INCOME";
	const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

	return (
		<Link
			href={`/transactions/${transaction.id}`}
			className="flex items-center gap-4 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
		>
			<div
				className={cn(
					"flex h-9 w-9 items-center justify-center rounded-full",
					isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
				)}
			>
				<Icon className="h-4 w-4" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium leading-none truncate">{transaction.description}</p>
				<div className="flex items-center gap-2 mt-1">
					<p className="text-xs text-muted-foreground">{formatDate(new Date(transaction.date))}</p>
					{transaction.category && (
						<span
							className="text-xs px-1.5 py-0.5 rounded-full bg-muted"
							style={
								transaction.category.color
									? { backgroundColor: `${transaction.category.color}20` }
									: undefined
							}
						>
							{transaction.category.name}
						</span>
					)}
				</div>
			</div>
			<div className={cn("text-sm font-medium", isIncome ? "text-green-600" : "text-red-600")}>
				{isIncome ? "+" : "-"}
				{formatCurrency(Math.abs(transaction.amount))}
			</div>
		</Link>
	);
}

function TransactionSkeleton() {
	return (
		<div className="flex items-center gap-4">
			<Skeleton className="h-9 w-9 rounded-full" />
			<div className="flex-1 space-y-1">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-20" />
			</div>
			<Skeleton className="h-4 w-16" />
		</div>
	);
}
