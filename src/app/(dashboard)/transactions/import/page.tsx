"use client";

import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBusiness } from "@/hooks/use-business";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
	getSupportedBanks,
	type ParsedTransaction,
	type ParseResult,
	parseCSV,
} from "@/lib/utils/csv-parsers";

interface BankAccount {
	id: string;
	name: string;
	bankName: string;
}

interface Category {
	id: string;
	name: string;
	type: string;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export default function ImportTransactionsPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const [step, setStep] = useState<ImportStep>("upload");
	const [file, setFile] = useState<File | null>(null);
	const [parseResult, setParseResult] = useState<ParseResult | null>(null);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [selectedAccount, setSelectedAccount] = useState<string>("");
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [selectedBank, setSelectedBank] = useState<string>("auto");
	const [skipDuplicates, setSkipDuplicates] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [isImporting, setIsImporting] = useState(false);
	const [importResult, setImportResult] = useState<{
		success: boolean;
		imported: number;
		duplicates: number;
		message: string;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);

	const supportedBanks = getSupportedBanks();

	const fetchData = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const [accountsRes, categoriesRes] = await Promise.all([
				fetch(`/api/businesses/${businessId}/bank-accounts`),
				fetch(`/api/businesses/${businessId}/categories`),
			]);

			if (accountsRes.ok) {
				const data = await accountsRes.json();
				setBankAccounts(data.bankAccounts || []);
			}

			if (categoriesRes.ok) {
				const data = await categoriesRes.json();
				setCategories(data.categories || []);
			}
		} catch (err) {
			console.error("Failed to fetch data:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) return;

		setError(null);
		setFile(selectedFile);

		const reader = new FileReader();
		reader.onload = (event) => {
			const content = event.target?.result as string;
			const result = parseCSV(content);
			setParseResult(result);

			if (result.success) {
				setStep("preview");
			} else {
				setError(result.errors[0] || "Failed to parse CSV file");
			}
		};
		reader.onerror = () => {
			setError("Failed to read file");
		};
		reader.readAsText(selectedFile);
	}

	function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
		e.preventDefault();
		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile && droppedFile.type === "text/csv") {
			const input = document.getElementById("csv-upload") as HTMLInputElement;
			if (input) {
				const dt = new DataTransfer();
				dt.items.add(droppedFile);
				input.files = dt.files;
				handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
			}
		}
	}

	async function handleImport() {
		if (!businessId || !selectedAccount || !file) return;

		setIsImporting(true);
		setStep("importing");
		setError(null);

		try {
			const content = await file.text();
			const response = await fetch(`/api/businesses/${businessId}/transactions/bulk`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					csvContent: content,
					bankAccountId: selectedAccount,
					bankName: selectedBank !== "auto" ? selectedBank : undefined,
					categoryId: selectedCategory || undefined,
					skipDuplicates,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Import failed");
			}

			setImportResult({
				success: true,
				imported: result.imported,
				duplicates: result.duplicates,
				message: result.message,
			});
			setStep("complete");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Import failed");
			setStep("preview");
		} finally {
			setIsImporting(false);
		}
	}

	function resetImport() {
		setStep("upload");
		setFile(null);
		setParseResult(null);
		setImportResult(null);
		setError(null);
		setSelectedAccount("");
		setSelectedCategory("");
		setSelectedBank("auto");
	}

	if (businessLoading || isLoading) {
		return <ImportPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to import transactions.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	if (bankAccounts.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
				<h2 className="text-xl font-semibold mb-2">No Bank Accounts</h2>
				<p className="text-muted-foreground mb-4">
					Create a bank account before importing transactions.
				</p>
				<Button asChild>
					<Link href="/accounts/new">Add Bank Account</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Import Transactions</h1>
				<p className="text-muted-foreground">
					Upload a CSV file from your bank to import transactions automatically
				</p>
			</div>

			{/* Supported Banks */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Supported Banks</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{supportedBanks.map((bank) => (
							<Badge key={bank.id} variant="secondary">
								{bank.name}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Step Content */}
			{step === "upload" && (
				<Card>
					<CardHeader>
						<CardTitle>Upload CSV File</CardTitle>
						<CardDescription>
							Download your bank statement as a CSV file and upload it here
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* File Upload */}
						<label
							htmlFor="csv-upload"
							className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors block"
							onDrop={handleDrop}
							onDragOver={(e) => e.preventDefault()}
						>
							<Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
							<p className="font-medium mb-1">Drop your CSV file here or click to browse</p>
							<p className="text-sm text-muted-foreground">Supports CSV files up to 10MB</p>
							<input
								id="csv-upload"
								type="file"
								accept=".csv,text/csv"
								className="hidden"
								onChange={handleFileChange}
							/>
						</label>

						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
					</CardContent>
				</Card>
			)}

			{step === "preview" && parseResult && (
				<>
					{/* Parse Result */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Preview Import</CardTitle>
									<CardDescription>
										{parseResult.transactions.length} transactions found from {parseResult.bankName}
									</CardDescription>
								</div>
								<Button variant="outline" size="sm" onClick={resetImport}>
									<X className="h-4 w-4 mr-2" />
									Cancel
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Configuration */}
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<div className="space-y-2">
									<Label>Bank Account *</Label>
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
									<Label>Default Category</Label>
									<Select value={selectedCategory} onValueChange={setSelectedCategory}>
										<SelectTrigger>
											<SelectValue placeholder="None" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">None</SelectItem>
											{categories.map((category) => (
												<SelectItem key={category.id} value={category.id}>
													{category.name} ({category.type})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label>Bank Format</Label>
									<Select value={selectedBank} onValueChange={setSelectedBank}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="auto">Auto-detect ({parseResult.bankName})</SelectItem>
											{supportedBanks.map((bank) => (
												<SelectItem key={bank.id} value={bank.id}>
													{bank.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="skip-duplicates">Skip Duplicates</Label>
									<div className="flex items-center space-x-2 pt-2">
										<Switch
											id="skip-duplicates"
											checked={skipDuplicates}
											onCheckedChange={setSkipDuplicates}
										/>
										<span className="text-sm text-muted-foreground">
											{skipDuplicates ? "Yes" : "No"}
										</span>
									</div>
								</div>
							</div>

							{/* Parse Errors */}
							{parseResult.errors.length > 0 && (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Parse Warnings</AlertTitle>
									<AlertDescription>
										<ul className="list-disc list-inside text-sm mt-2">
											{parseResult.errors.slice(0, 5).map((err) => (
												<li key={err}>{err}</li>
											))}
											{parseResult.errors.length > 5 && (
												<li>...and {parseResult.errors.length - 5} more</li>
											)}
										</ul>
									</AlertDescription>
								</Alert>
							)}

							{/* Preview Table */}
							<div className="rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Date</TableHead>
											<TableHead>Description</TableHead>
											<TableHead>Type</TableHead>
											<TableHead className="text-right">Amount</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{parseResult.transactions.slice(0, 10).map((tx) => (
											<TransactionPreviewRow
												key={`${tx.date.toISOString()}-${tx.description}-${tx.amount}`}
												transaction={tx}
											/>
										))}
									</TableBody>
								</Table>
								{parseResult.transactions.length > 10 && (
									<div className="p-3 text-center text-sm text-muted-foreground border-t">
										...and {parseResult.transactions.length - 10} more transactions
									</div>
								)}
							</div>

							{/* Import Button */}
							<div className="flex justify-end gap-3">
								<Button variant="outline" onClick={resetImport}>
									Cancel
								</Button>
								<Button onClick={handleImport} disabled={!selectedAccount || isImporting}>
									Import {parseResult.transactions.length} Transactions
								</Button>
							</div>
						</CardContent>
					</Card>
				</>
			)}

			{step === "importing" && (
				<Card>
					<CardContent className="py-12">
						<div className="flex flex-col items-center justify-center">
							<div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
							<p className="font-medium">Importing transactions...</p>
							<p className="text-sm text-muted-foreground">This may take a moment</p>
						</div>
					</CardContent>
				</Card>
			)}

			{step === "complete" && importResult && (
				<Card>
					<CardContent className="py-12">
						<div className="flex flex-col items-center justify-center">
							<div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
								<CheckCircle2 className="h-6 w-6 text-green-600" />
							</div>
							<h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
							<p className="text-muted-foreground mb-6">{importResult.message}</p>

							<div className="flex gap-8 mb-6">
								<div className="text-center">
									<p className="text-2xl font-bold">{importResult.imported}</p>
									<p className="text-sm text-muted-foreground">Imported</p>
								</div>
								{importResult.duplicates > 0 && (
									<div className="text-center">
										<p className="text-2xl font-bold">{importResult.duplicates}</p>
										<p className="text-sm text-muted-foreground">Skipped (duplicates)</p>
									</div>
								)}
							</div>

							<div className="flex gap-3">
								<Button variant="outline" onClick={resetImport}>
									Import More
								</Button>
								<Button asChild>
									<Link href="/transactions">View Transactions</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function TransactionPreviewRow({ transaction }: { transaction: ParsedTransaction }) {
	const isIncome = transaction.type === "INCOME";

	return (
		<TableRow>
			<TableCell className="whitespace-nowrap">
				{formatDate(transaction.date, { day: "2-digit", month: "short", year: "numeric" })}
			</TableCell>
			<TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
			<TableCell>
				<Badge variant={isIncome ? "default" : "secondary"}>{transaction.type}</Badge>
			</TableCell>
			<TableCell
				className={`text-right font-medium ${isIncome ? "text-green-600" : "text-red-600"}`}
			>
				{isIncome ? "+" : "-"}
				{formatCurrency(transaction.amount)}
			</TableCell>
		</TableRow>
	);
}

function ImportPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-96" />
			</div>
			<Skeleton className="h-20 rounded-lg" />
			<Skeleton className="h-64 rounded-lg" />
		</div>
	);
}
