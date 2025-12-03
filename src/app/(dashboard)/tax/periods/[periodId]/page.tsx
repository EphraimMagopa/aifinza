"use client";

import {
	AlertCircle,
	ArrowLeft,
	Calculator,
	CheckCircle2,
	Clock,
	FileText,
	Loader2,
	Save,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { taxPeriodStatusOptions, taxPeriodTypeOptions } from "@/lib/validations/tax";

interface TaxPeriod {
	id: string;
	type: string;
	startDate: string;
	endDate: string;
	dueDate: string;
	status: string;
	vatOutput: number | null;
	vatInput: number | null;
	vatPayable: number | null;
	submittedAt: string | null;
	referenceNumber: string | null;
	notes: string | null;
}

interface CalculatedVat {
	outputVat: number;
	inputVat: number;
	netVat: number;
}

export default function TaxPeriodDetailPage() {
	const params = useParams();
	const periodId = params.periodId as string;

	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [period, setPeriod] = useState<TaxPeriod | null>(null);
	const [calculatedVat, setCalculatedVat] = useState<CalculatedVat | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Form state
	const [status, setStatus] = useState("");
	const [vatOutput, setVatOutput] = useState("");
	const [vatInput, setVatInput] = useState("");
	const [referenceNumber, setReferenceNumber] = useState("");
	const [notes, setNotes] = useState("");

	const fetchPeriod = useCallback(async () => {
		if (!businessId || !periodId) return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/tax/periods/${periodId}`);
			if (response.ok) {
				const data = await response.json();
				setPeriod(data.period);
				setCalculatedVat(data.calculatedVat);

				// Set form values
				setStatus(data.period.status);
				setVatOutput(data.period.vatOutput?.toString() || "");
				setVatInput(data.period.vatInput?.toString() || "");
				setReferenceNumber(data.period.referenceNumber || "");
				setNotes(data.period.notes || "");
			}
		} catch (err) {
			console.error("Failed to fetch tax period:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, periodId]);

	useEffect(() => {
		fetchPeriod();
	}, [fetchPeriod]);

	async function handleSave() {
		if (!businessId || !periodId) return;

		setIsSaving(true);
		try {
			const vatPayable =
				vatOutput && vatInput ? Number.parseFloat(vatOutput) - Number.parseFloat(vatInput) : null;

			const response = await fetch(`/api/businesses/${businessId}/tax/periods/${periodId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					status,
					outputVat: vatOutput ? Number.parseFloat(vatOutput) : null,
					inputVat: vatInput ? Number.parseFloat(vatInput) : null,
					vatPayable,
					reference: referenceNumber || null,
					notes: notes || null,
				}),
			});

			if (response.ok) {
				fetchPeriod();
			}
		} catch (err) {
			console.error("Failed to save tax period:", err);
		} finally {
			setIsSaving(false);
		}
	}

	function applyCalculatedValues() {
		if (calculatedVat) {
			setVatOutput(calculatedVat.outputVat.toFixed(2));
			setVatInput(calculatedVat.inputVat.toFixed(2));
		}
	}

	const statusColors: Record<string, string> = {
		OPEN: "bg-blue-100 text-blue-800",
		IN_PROGRESS: "bg-yellow-100 text-yellow-800",
		READY_TO_SUBMIT: "bg-orange-100 text-orange-800",
		SUBMITTED: "bg-green-100 text-green-800",
		PAID: "bg-purple-100 text-purple-800",
		OVERDUE: "bg-red-100 text-red-800",
	};

	const getStatusIcon = (statusValue: string) => {
		switch (statusValue) {
			case "SUBMITTED":
			case "PAID":
				return <CheckCircle2 className="h-4 w-4" />;
			case "IN_PROGRESS":
			case "READY_TO_SUBMIT":
				return <Clock className="h-4 w-4" />;
			case "OVERDUE":
				return <AlertCircle className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	if (businessLoading || isLoading) {
		return <TaxPeriodSkeleton />;
	}

	if (!period) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
				<h2 className="text-xl font-semibold mb-2">Tax Period Not Found</h2>
				<p className="text-muted-foreground mb-4">
					The tax period you're looking for doesn't exist.
				</p>
				<Button asChild>
					<Link href="/tax">Back to Tax</Link>
				</Button>
			</div>
		);
	}

	const isOverdue = new Date(period.dueDate) < new Date() && period.status !== "SUBMITTED";
	const periodTypeName =
		taxPeriodTypeOptions.find((t) => t.value === period.type)?.label || period.type;

	const currentVatPayable =
		vatOutput && vatInput ? Number.parseFloat(vatOutput) - Number.parseFloat(vatInput) : null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/tax">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold tracking-tight">{periodTypeName}</h1>
							<Badge className={statusColors[period.status] || ""}>
								<span className="flex items-center gap-1">
									{getStatusIcon(period.status)}
									{period.status}
								</span>
							</Badge>
							{isOverdue && (
								<Badge className="bg-red-100 text-red-800">
									<AlertCircle className="h-3 w-3 mr-1" />
									OVERDUE
								</Badge>
							)}
						</div>
						<p className="text-muted-foreground">
							{formatDate(new Date(period.startDate), { month: "short", year: "numeric" })} -{" "}
							{formatDate(new Date(period.endDate), { month: "short", year: "numeric" })}
						</p>
					</div>
				</div>
				{canManage && period.status !== "PAID" && (
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Save className="mr-2 h-4 w-4" />
						)}
						Save Changes
					</Button>
				)}
			</div>

			{/* Period Info */}
			<Card>
				<CardHeader>
					<CardTitle>Period Details</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-4">
						<div>
							<p className="text-sm text-muted-foreground">Start Date</p>
							<p className="font-medium">
								{formatDate(new Date(period.startDate), {
									day: "2-digit",
									month: "short",
									year: "numeric",
								})}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">End Date</p>
							<p className="font-medium">
								{formatDate(new Date(period.endDate), {
									day: "2-digit",
									month: "short",
									year: "numeric",
								})}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Due Date</p>
							<p className={cn("font-medium", isOverdue && "text-red-600")}>
								{formatDate(new Date(period.dueDate), {
									day: "2-digit",
									month: "short",
									year: "numeric",
								})}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Submitted</p>
							<p className="font-medium">
								{period.submittedAt
									? formatDate(new Date(period.submittedAt), {
											day: "2-digit",
											month: "short",
											year: "numeric",
										})
									: "-"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* VAT Calculation (for VAT periods) */}
			{period.type === "VAT" && (
				<div className="grid gap-6 md:grid-cols-2">
					{/* Calculated Values */}
					{calculatedVat && (
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											<Calculator className="h-5 w-5" />
											Calculated VAT
										</CardTitle>
										<CardDescription>Based on invoices and transactions</CardDescription>
									</div>
									{canManage && period.status !== "PAID" && (
										<Button variant="outline" size="sm" onClick={applyCalculatedValues}>
											Apply Values
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between py-2">
									<span className="text-muted-foreground">Output VAT (Sales)</span>
									<span className="font-medium text-red-600">
										{formatCurrency(calculatedVat.outputVat)}
									</span>
								</div>
								<div className="flex justify-between py-2">
									<span className="text-muted-foreground">Input VAT (Purchases)</span>
									<span className="font-medium text-green-600">
										{formatCurrency(calculatedVat.inputVat)}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between py-2">
									<span className="font-medium">
										{calculatedVat.netVat >= 0 ? "VAT Payable" : "VAT Refundable"}
									</span>
									<span
										className={cn(
											"font-bold text-lg",
											calculatedVat.netVat >= 0 ? "text-red-600" : "text-green-600"
										)}
									>
										{formatCurrency(Math.abs(calculatedVat.netVat))}
									</span>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Submitted Values */}
					<Card>
						<CardHeader>
							<CardTitle>Filed Values</CardTitle>
							<CardDescription>Values submitted to SARS</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="vatOutput">Output VAT (R)</Label>
								<Input
									id="vatOutput"
									type="number"
									step="0.01"
									value={vatOutput}
									onChange={(e) => setVatOutput(e.target.value)}
									disabled={!canManage || period.status === "PAID"}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="vatInput">Input VAT (R)</Label>
								<Input
									id="vatInput"
									type="number"
									step="0.01"
									value={vatInput}
									onChange={(e) => setVatInput(e.target.value)}
									disabled={!canManage || period.status === "PAID"}
								/>
							</div>

							<Separator />

							<div className="flex justify-between py-2">
								<span className="font-medium">
									{currentVatPayable !== null && currentVatPayable >= 0
										? "VAT Payable"
										: "VAT Refundable"}
								</span>
								<span
									className={cn(
										"font-bold text-lg",
										currentVatPayable !== null && currentVatPayable >= 0
											? "text-red-600"
											: "text-green-600"
									)}
								>
									{currentVatPayable !== null ? formatCurrency(Math.abs(currentVatPayable)) : "-"}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Status & Reference */}
			<Card>
				<CardHeader>
					<CardTitle>Submission Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select
								value={status}
								onValueChange={setStatus}
								disabled={!canManage || period.status === "PAID"}
							>
								<SelectTrigger id="status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{taxPeriodStatusOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="referenceNumber">SARS Reference Number</Label>
							<Input
								id="referenceNumber"
								placeholder="e.g., VAT201-2024-001"
								value={referenceNumber}
								onChange={(e) => setReferenceNumber(e.target.value)}
								disabled={!canManage || period.status === "PAID"}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">Notes</Label>
						<Textarea
							id="notes"
							placeholder="Any additional notes about this submission..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							disabled={!canManage || period.status === "PAID"}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Quick Links */}
			<div className="flex gap-4">
				<Button variant="outline" asChild>
					<Link href={`/reports/vat?period=${periodId}`}>View VAT Report</Link>
				</Button>
			</div>
		</div>
	);
}

function TaxPeriodSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			<Skeleton className="h-32 rounded-lg" />
			<div className="grid gap-6 md:grid-cols-2">
				<Skeleton className="h-64 rounded-lg" />
				<Skeleton className="h-64 rounded-lg" />
			</div>
			<Skeleton className="h-48 rounded-lg" />
		</div>
	);
}
