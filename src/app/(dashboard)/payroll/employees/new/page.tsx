"use client";

import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { useBusiness } from "@/hooks/use-business";
import { SA_BANKS } from "@/lib/constants/south-africa";
import {
	employmentTypeOptions,
	payFrequencyOptions,
	salaryTypeOptions,
} from "@/lib/validations/payroll";

export default function NewEmployeePage() {
	const router = useRouter();
	const { businessId } = useBusiness();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		idNumber: "",
		employeeNumber: "",
		jobTitle: "",
		department: "",
		startDate: format(new Date(), "yyyy-MM-dd"),
		employmentType: "FULL_TIME",
		salaryType: "MONTHLY",
		salaryAmount: "",
		payFrequency: "MONTHLY",
		taxNumber: "",
		bankName: "",
		accountNumber: "",
		branchCode: "",
	});

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!businessId) return;

		setIsSubmitting(true);
		setError(null);

		try {
			const response = await fetch(`/api/businesses/${businessId}/employees`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					startDate: new Date(formData.startDate).toISOString(),
					salaryAmount: Number.parseFloat(formData.salaryAmount) || 0,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				router.push(`/payroll/employees/${data.employee.id}`);
			} else {
				const data = await response.json();
				setError(data.error || "Failed to create employee");
			}
		} catch (err) {
			console.error("Failed to create employee:", err);
			setError("An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (!businessId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Please select a business first.</p>
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
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Add Employee</h1>
					<p className="text-muted-foreground">Enter the employee details below</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{error && (
					<div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>
				)}

				{/* Personal Information */}
				<Card>
					<CardHeader>
						<CardTitle>Personal Information</CardTitle>
						<CardDescription>Basic employee details</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name *</Label>
							<Input
								id="firstName"
								value={formData.firstName}
								onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name *</Label>
							<Input
								id="lastName"
								value={formData.lastName}
								onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							<Input
								id="phone"
								value={formData.phone}
								onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="idNumber">ID Number</Label>
							<Input
								id="idNumber"
								value={formData.idNumber}
								onChange={(e) => setFormData((prev) => ({ ...prev, idNumber: e.target.value }))}
								maxLength={13}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="taxNumber">SARS Tax Number</Label>
							<Input
								id="taxNumber"
								value={formData.taxNumber}
								onChange={(e) => setFormData((prev) => ({ ...prev, taxNumber: e.target.value }))}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Employment Details */}
				<Card>
					<CardHeader>
						<CardTitle>Employment Details</CardTitle>
						<CardDescription>Job and compensation information</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="employeeNumber">Employee Number</Label>
							<Input
								id="employeeNumber"
								value={formData.employeeNumber}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										employeeNumber: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="jobTitle">Job Title</Label>
							<Input
								id="jobTitle"
								value={formData.jobTitle}
								onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="department">Department</Label>
							<Input
								id="department"
								value={formData.department}
								onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="startDate">Start Date *</Label>
							<Input
								id="startDate"
								type="date"
								value={formData.startDate}
								onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="employmentType">Employment Type *</Label>
							<Select
								value={formData.employmentType}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, employmentType: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{employmentTypeOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="salaryType">Salary Type *</Label>
							<Select
								value={formData.salaryType}
								onValueChange={(value) => setFormData((prev) => ({ ...prev, salaryType: value }))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{salaryTypeOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="salaryAmount">Salary Amount (ZAR) *</Label>
							<Input
								id="salaryAmount"
								type="number"
								step="0.01"
								min="0"
								value={formData.salaryAmount}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										salaryAmount: e.target.value,
									}))
								}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="payFrequency">Pay Frequency *</Label>
							<Select
								value={formData.payFrequency}
								onValueChange={(value) => setFormData((prev) => ({ ...prev, payFrequency: value }))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{payFrequencyOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Banking Details */}
				<Card>
					<CardHeader>
						<CardTitle>Banking Details</CardTitle>
						<CardDescription>For salary payments</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="bankName">Bank</Label>
							<Select
								value={formData.bankName}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										bankName: value,
										branchCode: SA_BANKS.find((b) => b.value === value)?.branchCode || "",
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select bank" />
								</SelectTrigger>
								<SelectContent>
									{SA_BANKS.map((bank) => (
										<SelectItem key={bank.value} value={bank.value}>
											{bank.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="accountNumber">Account Number</Label>
							<Input
								id="accountNumber"
								value={formData.accountNumber}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										accountNumber: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="branchCode">Branch Code</Label>
							<Input
								id="branchCode"
								value={formData.branchCode}
								onChange={(e) => setFormData((prev) => ({ ...prev, branchCode: e.target.value }))}
							/>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" asChild>
						<Link href="/payroll">Cancel</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Creating..." : "Create Employee"}
					</Button>
				</div>
			</form>
		</div>
	);
}
