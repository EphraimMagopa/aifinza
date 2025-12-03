"use client";

import { format } from "date-fns";
import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type { Employee } from "@/types/payroll";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/payroll";

export default function PayrollPage() {
	const { businessId } = useBusiness();
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState("");

	useEffect(() => {
		async function fetchEmployees() {
			if (!businessId) return;

			setIsLoading(true);
			try {
				const params = new URLSearchParams();
				if (search) params.set("search", search);

				const response = await fetch(`/api/businesses/${businessId}/employees?${params}`);
				if (response.ok) {
					const data = await response.json();
					setEmployees(data.employees);
				}
			} catch (error) {
				console.error("Failed to fetch employees:", error);
			} finally {
				setIsLoading(false);
			}
		}

		const debounce = setTimeout(fetchEmployees, 300);
		return () => clearTimeout(debounce);
	}, [businessId, search]);

	if (!businessId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Please select a business first.</p>
			</div>
		);
	}

	const activeEmployees = employees.filter((e) => e.isActive);
	const totalSalary = activeEmployees.reduce((sum, e) => sum + e.salaryAmount, 0);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
					<p className="text-muted-foreground">Manage employees and generate payslips</p>
				</div>
				<Button asChild>
					<Link href="/payroll/employees/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Employee
					</Link>
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Employees</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{employees.length}</div>
						<p className="text-xs text-muted-foreground">{activeEmployees.length} active</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(totalSalary)}</div>
						<p className="text-xs text-muted-foreground">Active employees only</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Est. Annual Cost</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(totalSalary * 12 * 1.03)}</div>
						<p className="text-xs text-muted-foreground">Including UIF & SDL contributions</p>
					</CardContent>
				</Card>
			</div>

			{/* Employees Table */}
			<Card>
				<CardHeader>
					<CardTitle>Employees</CardTitle>
					<CardDescription>View and manage all employees in your business</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4 mb-4">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search employees..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>
					</div>

					{isLoading ? (
						<EmployeeTableSkeleton />
					) : employees.length === 0 ? (
						<div className="text-center py-8">
							<Users className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-4 text-lg font-semibold">No employees yet</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Add your first employee to get started with payroll
							</p>
							<Button asChild className="mt-4">
								<Link href="/payroll/employees/new">
									<Plus className="mr-2 h-4 w-4" />
									Add Employee
								</Link>
							</Button>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Job Title</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Start Date</TableHead>
										<TableHead className="text-right">Salary</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{employees.map((employee) => (
										<TableRow key={employee.id}>
											<TableCell>
												<Link
													href={`/payroll/employees/${employee.id}`}
													className="font-medium hover:underline"
												>
													{employee.firstName} {employee.lastName}
												</Link>
												{employee.email && (
													<p className="text-sm text-muted-foreground">{employee.email}</p>
												)}
											</TableCell>
											<TableCell>{employee.jobTitle || "-"}</TableCell>
											<TableCell>{EMPLOYMENT_TYPE_LABELS[employee.employmentType]}</TableCell>
											<TableCell>{format(new Date(employee.startDate), "MMM d, yyyy")}</TableCell>
											<TableCell className="text-right">
												{formatCurrency(employee.salaryAmount)}
												<span className="text-xs text-muted-foreground">/mo</span>
											</TableCell>
											<TableCell>
												<Badge variant={employee.isActive ? "default" : "secondary"}>
													{employee.isActive ? "Active" : "Inactive"}
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
		</div>
	);
}

function EmployeeTableSkeleton() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 5 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
				<Skeleton key={`emp-skeleton-${i}`} className="h-16 w-full" />
			))}
		</div>
	);
}
