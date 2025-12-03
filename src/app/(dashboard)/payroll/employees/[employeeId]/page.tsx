"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import { ArrowLeft, FileText, Plus, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBusiness } from "@/hooks/use-business";
import { formatCurrency } from "@/lib/utils";
import type { Employee, Payslip } from "@/types/payroll";
import {
	EMPLOYMENT_TYPE_LABELS,
	PAYSLIP_STATUS_COLORS,
	PAYSLIP_STATUS_LABELS,
} from "@/types/payroll";

export default function EmployeeDetailPage() {
	const params = useParams();
	const employeeId = params.employeeId as string;
	const { businessId } = useBusiness();

	const [employee, setEmployee] = useState<(Employee & { payslips: Payslip[] }) | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showPayslipDialog, setShowPayslipDialog] = useState(false);
	const [isCreatingPayslip, setIsCreatingPayslip] = useState(false);

	const now = new Date();
	const [payslipData, setPayslipData] = useState({
		payPeriodStart: format(startOfMonth(now), "yyyy-MM-dd"),
		payPeriodEnd: format(endOfMonth(now), "yyyy-MM-dd"),
		payDate: format(endOfMonth(now), "yyyy-MM-dd"),
		basicSalary: "",
		overtime: "0",
		bonus: "0",
		commission: "0",
		allowances: "0",
		pensionEmployee: "0",
		medicalAid: "0",
		otherDeductions: "0",
		pensionEmployer: "0",
	});

	useEffect(() => {
		async function fetchEmployee() {
			if (!businessId) return;

			setIsLoading(true);
			try {
				const response = await fetch(`/api/businesses/${businessId}/employees/${employeeId}`);
				if (response.ok) {
					const data = await response.json();
					setEmployee(data.employee);
					setPayslipData((prev) => ({
						...prev,
						basicSalary: data.employee.salaryAmount.toString(),
					}));
				}
			} catch (error) {
				console.error("Failed to fetch employee:", error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchEmployee();
	}, [businessId, employeeId]);

	async function handleCreatePayslip(e: React.FormEvent) {
		e.preventDefault();
		if (!businessId || !employee) return;

		setIsCreatingPayslip(true);
		try {
			const response = await fetch(
				`/api/businesses/${businessId}/employees/${employeeId}/payslips`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						employeeId,
						payPeriodStart: new Date(payslipData.payPeriodStart).toISOString(),
						payPeriodEnd: new Date(payslipData.payPeriodEnd).toISOString(),
						payDate: new Date(payslipData.payDate).toISOString(),
						basicSalary: Number.parseFloat(payslipData.basicSalary) || 0,
						overtime: Number.parseFloat(payslipData.overtime) || 0,
						bonus: Number.parseFloat(payslipData.bonus) || 0,
						commission: Number.parseFloat(payslipData.commission) || 0,
						allowances: Number.parseFloat(payslipData.allowances) || 0,
						pensionEmployee: Number.parseFloat(payslipData.pensionEmployee) || 0,
						medicalAid: Number.parseFloat(payslipData.medicalAid) || 0,
						otherDeductions: Number.parseFloat(payslipData.otherDeductions) || 0,
						pensionEmployer: Number.parseFloat(payslipData.pensionEmployer) || 0,
					}),
				}
			);

			if (response.ok) {
				const data = await response.json();
				setEmployee((prev) =>
					prev ? { ...prev, payslips: [data.payslip, ...prev.payslips] } : prev
				);
				setShowPayslipDialog(false);
			}
		} catch (error) {
			console.error("Failed to create payslip:", error);
		} finally {
			setIsCreatingPayslip(false);
		}
	}

	if (!businessId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Please select a business first.</p>
			</div>
		);
	}

	if (isLoading) {
		return <EmployeeDetailSkeleton />;
	}

	if (!employee) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Employee not found.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/payroll">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold tracking-tight">
						{employee.firstName} {employee.lastName}
					</h1>
					<p className="text-muted-foreground">
						{employee.jobTitle || "No job title"} &middot;{" "}
						{EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
					</p>
				</div>
				<Badge variant={employee.isActive ? "default" : "secondary"}>
					{employee.isActive ? "Active" : "Inactive"}
				</Badge>
			</div>

			{/* Employee Info Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Monthly Salary</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(employee.salaryAmount)}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Start Date</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{format(new Date(employee.startDate), "MMM d, yyyy")}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Payslips</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{employee.payslips.length}</div>
					</CardContent>
				</Card>
			</div>

			{/* Employee Details */}
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Personal Details
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Email</span>
							<span>{employee.email || "-"}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Phone</span>
							<span>{employee.phone || "-"}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">ID Number</span>
							<span>{employee.idNumber || "-"}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tax Number</span>
							<span>{employee.taxNumber || "-"}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Department</span>
							<span>{employee.department || "-"}</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Banking Details
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Bank</span>
							<span>{employee.bankName || "-"}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Account Number</span>
							<span>{employee.accountNumber || "-"}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Branch Code</span>
							<span>{employee.branchCode || "-"}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Payslips */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Payslips</CardTitle>
						<CardDescription>Salary history and payslip records</CardDescription>
					</div>
					<Button onClick={() => setShowPayslipDialog(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Generate Payslip
					</Button>
				</CardHeader>
				<CardContent>
					{employee.payslips.length === 0 ? (
						<div className="text-center py-8">
							<FileText className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-4 text-lg font-semibold">No payslips yet</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Generate the first payslip for this employee
							</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Period</TableHead>
										<TableHead>Pay Date</TableHead>
										<TableHead className="text-right">Gross</TableHead>
										<TableHead className="text-right">Deductions</TableHead>
										<TableHead className="text-right">Net Pay</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{employee.payslips.map((payslip) => (
										<TableRow key={payslip.id}>
											<TableCell>
												{format(new Date(payslip.payPeriodStart), "MMM d")} -{" "}
												{format(new Date(payslip.payPeriodEnd), "MMM d, yyyy")}
											</TableCell>
											<TableCell>{format(new Date(payslip.payDate), "MMM d, yyyy")}</TableCell>
											<TableCell className="text-right">
												{formatCurrency(payslip.grossPay)}
											</TableCell>
											<TableCell className="text-right">
												{formatCurrency(payslip.totalDeductions)}
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatCurrency(payslip.netPay)}
											</TableCell>
											<TableCell>
												<Badge
													className={PAYSLIP_STATUS_COLORS[payslip.status]}
													variant="secondary"
												>
													{PAYSLIP_STATUS_LABELS[payslip.status]}
												</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Generate Payslip Dialog */}
			<Dialog open={showPayslipDialog} onOpenChange={setShowPayslipDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Generate Payslip</DialogTitle>
						<DialogDescription>
							Create a new payslip for {employee.firstName} {employee.lastName}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreatePayslip} className="space-y-4">
						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<Label htmlFor="payPeriodStart">Period Start</Label>
								<Input
									id="payPeriodStart"
									type="date"
									value={payslipData.payPeriodStart}
									onChange={(e) =>
										setPayslipData((prev) => ({
											...prev,
											payPeriodStart: e.target.value,
										}))
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="payPeriodEnd">Period End</Label>
								<Input
									id="payPeriodEnd"
									type="date"
									value={payslipData.payPeriodEnd}
									onChange={(e) =>
										setPayslipData((prev) => ({
											...prev,
											payPeriodEnd: e.target.value,
										}))
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="payDate">Pay Date</Label>
								<Input
									id="payDate"
									type="date"
									value={payslipData.payDate}
									onChange={(e) => setPayslipData((prev) => ({ ...prev, payDate: e.target.value }))}
									required
								/>
							</div>
						</div>

						<div className="border-t pt-4">
							<h4 className="font-medium mb-3">Earnings</h4>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="basicSalary">Basic Salary</Label>
									<Input
										id="basicSalary"
										type="number"
										step="0.01"
										value={payslipData.basicSalary}
										onChange={(e) =>
											setPayslipData((prev) => ({
												...prev,
												basicSalary: e.target.value,
											}))
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="overtime">Overtime</Label>
									<Input
										id="overtime"
										type="number"
										step="0.01"
										value={payslipData.overtime}
										onChange={(e) =>
											setPayslipData((prev) => ({
												...prev,
												overtime: e.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="bonus">Bonus</Label>
									<Input
										id="bonus"
										type="number"
										step="0.01"
										value={payslipData.bonus}
										onChange={(e) => setPayslipData((prev) => ({ ...prev, bonus: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="allowances">Allowances</Label>
									<Input
										id="allowances"
										type="number"
										step="0.01"
										value={payslipData.allowances}
										onChange={(e) =>
											setPayslipData((prev) => ({
												...prev,
												allowances: e.target.value,
											}))
										}
									/>
								</div>
							</div>
						</div>

						<div className="border-t pt-4">
							<h4 className="font-medium mb-3">Deductions</h4>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="pensionEmployee">Pension (Employee)</Label>
									<Input
										id="pensionEmployee"
										type="number"
										step="0.01"
										value={payslipData.pensionEmployee}
										onChange={(e) =>
											setPayslipData((prev) => ({
												...prev,
												pensionEmployee: e.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="medicalAid">Medical Aid</Label>
									<Input
										id="medicalAid"
										type="number"
										step="0.01"
										value={payslipData.medicalAid}
										onChange={(e) =>
											setPayslipData((prev) => ({
												...prev,
												medicalAid: e.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="otherDeductions">Other Deductions</Label>
									<Input
										id="otherDeductions"
										type="number"
										step="0.01"
										value={payslipData.otherDeductions}
										onChange={(e) =>
											setPayslipData((prev) => ({
												...prev,
												otherDeductions: e.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pensionEmployer">Pension (Employer)</Label>
									<Input
										id="pensionEmployer"
										type="number"
										step="0.01"
										value={payslipData.pensionEmployer}
										onChange={(e) =>
											setPayslipData((prev) => ({
												...prev,
												pensionEmployer: e.target.value,
											}))
										}
									/>
								</div>
							</div>
						</div>

						<p className="text-sm text-muted-foreground">
							PAYE, UIF (1%), and SDL (1%) will be calculated automatically based on SA tax tables.
						</p>

						<div className="flex justify-end gap-4 pt-4">
							<Button type="button" variant="outline" onClick={() => setShowPayslipDialog(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={isCreatingPayslip}>
								{isCreatingPayslip ? "Generating..." : "Generate Payslip"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function EmployeeDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
					<Skeleton key={`stat-${i}`} className="h-24" />
				))}
			</div>
			<Skeleton className="h-64" />
		</div>
	);
}
