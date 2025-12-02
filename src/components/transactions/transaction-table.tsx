"use client";

import { ArrowDownLeft, ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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

interface TransactionTableProps {
	transactions: Transaction[];
	isLoading: boolean;
	selectedIds: string[];
	onSelectChange: (id: string, selected: boolean) => void;
	onSelectAll: (selected: boolean) => void;
	onDelete: (id: string) => void;
	canEdit: boolean;
	canDelete: boolean;
}

export function TransactionTable({
	transactions,
	isLoading,
	selectedIds,
	onSelectChange,
	onSelectAll,
	onDelete,
	canEdit,
	canDelete,
}: TransactionTableProps) {
	if (isLoading) {
		return <TransactionTableSkeleton />;
	}

	if (transactions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
				<p className="text-muted-foreground">No transactions found.</p>
			</div>
		);
	}

	const allSelected = transactions.length > 0 && selectedIds.length === transactions.length;
	const someSelected = selectedIds.length > 0 && selectedIds.length < transactions.length;

	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[40px]">
							<Checkbox
								checked={someSelected ? "indeterminate" : allSelected}
								onCheckedChange={onSelectAll}
								aria-label="Select all"
							/>
						</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Account</TableHead>
						<TableHead className="text-right">Amount</TableHead>
						<TableHead className="w-[50px]" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{transactions.map((transaction) => (
						<TransactionRow
							key={transaction.id}
							transaction={transaction}
							isSelected={selectedIds.includes(transaction.id)}
							onSelectChange={onSelectChange}
							onDelete={onDelete}
							canEdit={canEdit}
							canDelete={canDelete}
						/>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function TransactionRow({
	transaction,
	isSelected,
	onSelectChange,
	onDelete,
	canEdit,
	canDelete,
}: {
	transaction: Transaction;
	isSelected: boolean;
	onSelectChange: (id: string, selected: boolean) => void;
	onDelete: (id: string) => void;
	canEdit: boolean;
	canDelete: boolean;
}) {
	const isIncome = transaction.type === "INCOME";
	const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

	return (
		<TableRow className={cn(isSelected && "bg-muted/50")}>
			<TableCell>
				<Checkbox
					checked={isSelected}
					onCheckedChange={(checked) => onSelectChange(transaction.id, checked === true)}
					aria-label={`Select transaction ${transaction.description}`}
				/>
			</TableCell>
			<TableCell className="whitespace-nowrap">
				{formatDate(new Date(transaction.date), { day: "2-digit", month: "short" })}
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-2">
					<div
						className={cn(
							"flex h-6 w-6 items-center justify-center rounded-full shrink-0",
							isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
						)}
					>
						<Icon className="h-3 w-3" />
					</div>
					<div className="min-w-0">
						<p className="truncate font-medium">{transaction.description}</p>
						{transaction.reference && (
							<p className="text-xs text-muted-foreground truncate">{transaction.reference}</p>
						)}
					</div>
					{transaction.isReconciled && (
						<Badge variant="outline" className="shrink-0">
							Reconciled
						</Badge>
					)}
				</div>
			</TableCell>
			<TableCell>
				{transaction.category ? (
					<Badge
						variant="secondary"
						style={
							transaction.category.color
								? { backgroundColor: `${transaction.category.color}20` }
								: undefined
						}
					>
						{transaction.category.name}
					</Badge>
				) : (
					<span className="text-muted-foreground">Uncategorized</span>
				)}
			</TableCell>
			<TableCell>
				{transaction.bankAccount ? (
					<span className="text-sm">{transaction.bankAccount.name}</span>
				) : (
					<span className="text-muted-foreground">-</span>
				)}
			</TableCell>
			<TableCell className="text-right">
				<span className={cn("font-medium", isIncome ? "text-green-600" : "text-red-600")}>
					{isIncome ? "+" : "-"}
					{formatCurrency(Math.abs(transaction.amount))}
				</span>
			</TableCell>
			<TableCell>
				{(canEdit || canDelete) && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{canEdit && (
								<DropdownMenuItem asChild>
									<Link href={`/transactions/${transaction.id}`}>
										<Pencil className="mr-2 h-4 w-4" />
										Edit
									</Link>
								</DropdownMenuItem>
							)}
							{canDelete && !transaction.isReconciled && (
								<>
									{canEdit && <DropdownMenuSeparator />}
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => onDelete(transaction.id)}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</TableCell>
		</TableRow>
	);
}

function TransactionTableSkeleton() {
	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[40px]">
							<Skeleton className="h-4 w-4" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-4 w-16" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-4 w-24" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-4 w-20" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-4 w-20" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-4 w-16" />
						</TableHead>
						<TableHead className="w-[50px]" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: 5 }).map((_, i) => (
						<TableRow key={`skeleton-${i}`}>
							<TableCell>
								<Skeleton className="h-4 w-4" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-16" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-32" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-20" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-24" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-20" />
							</TableCell>
							<TableCell />
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
