"use client";

import { CreditCard, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency } from "@/lib/utils";
import { bankAccountTypeOptions } from "@/lib/validations/bank-account";

interface AccountCardProps {
	account: {
		id: string;
		name: string;
		bankName: string;
		accountNumber: string;
		accountType: string;
		currentBalance: number;
		isActive: boolean;
		currency: string;
	};
	onToggleActive?: (id: string, isActive: boolean) => void;
	onDelete?: (id: string) => void;
}

export function AccountCard({ account, onToggleActive, onDelete }: AccountCardProps) {
	const typeLabel =
		bankAccountTypeOptions.find((t) => t.value === account.accountType)?.label ||
		account.accountType;

	const maskedNumber = account.accountNumber.slice(-4).padStart(account.accountNumber.length, "*");

	return (
		<Card className={cn(!account.isActive && "opacity-60")}>
			<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<CreditCard className="h-5 w-5 text-primary" />
					</div>
					<div>
						<CardTitle className="text-base">{account.name}</CardTitle>
						<p className="text-sm text-muted-foreground">{account.bankName}</p>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<MoreHorizontal className="h-4 w-4" />
							<span className="sr-only">Actions</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link href={`/accounts/${account.id}`}>
								<Pencil className="mr-2 h-4 w-4" />
								Edit
							</Link>
						</DropdownMenuItem>
						{onToggleActive && (
							<DropdownMenuItem onClick={() => onToggleActive(account.id, !account.isActive)}>
								<Power className="mr-2 h-4 w-4" />
								{account.isActive ? "Deactivate" : "Activate"}
							</DropdownMenuItem>
						)}
						{onDelete && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onClick={() => onDelete(account.id)}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs text-muted-foreground">Account</p>
						<p className="text-sm font-mono">{maskedNumber}</p>
					</div>
					<div className="text-right">
						<p className="text-xs text-muted-foreground">Balance</p>
						<p
							className={cn(
								"text-lg font-semibold",
								account.currentBalance >= 0 ? "text-green-600" : "text-red-600"
							)}
						>
							{formatCurrency(account.currentBalance, account.currency)}
						</p>
					</div>
				</div>
				<div className="mt-3 flex items-center gap-2">
					<Badge variant="secondary">{typeLabel}</Badge>
					{!account.isActive && <Badge variant="outline">Inactive</Badge>}
				</div>
			</CardContent>
		</Card>
	);
}
