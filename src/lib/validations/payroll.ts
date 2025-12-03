import { z } from "zod";

export const employmentTypeOptions = [
	{ value: "FULL_TIME", label: "Full Time" },
	{ value: "PART_TIME", label: "Part Time" },
	{ value: "CONTRACT", label: "Contract" },
	{ value: "TEMPORARY", label: "Temporary" },
	{ value: "INTERN", label: "Intern" },
] as const;

export const salaryTypeOptions = [
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "HOURLY", label: "Hourly" },
	{ value: "ANNUAL", label: "Annual" },
] as const;

export const payFrequencyOptions = [
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "FORTNIGHTLY", label: "Fortnightly" },
	{ value: "MONTHLY", label: "Monthly" },
] as const;

export const payslipStatusOptions = [
	{ value: "DRAFT", label: "Draft" },
	{ value: "APPROVED", label: "Approved" },
	{ value: "PAID", label: "Paid" },
] as const;

export const createEmployeeSchema = z.object({
	firstName: z.string().min(1, "First name is required").max(100),
	lastName: z.string().min(1, "Last name is required").max(100),
	idNumber: z.string().max(20).optional(),
	email: z.string().email().optional().or(z.literal("")),
	phone: z.string().max(20).optional(),
	employeeNumber: z.string().max(50).optional(),
	jobTitle: z.string().max(100).optional(),
	department: z.string().max(100).optional(),
	startDate: z.string().datetime(),
	endDate: z.string().datetime().optional(),
	employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY", "INTERN"]),
	salaryType: z.enum(["MONTHLY", "HOURLY", "ANNUAL"]),
	salaryAmount: z.number().min(0, "Salary must be positive"),
	payFrequency: z
		.enum(["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY", "ANNUALLY"])
		.default("MONTHLY"),
	taxNumber: z.string().max(20).optional(),
	bankName: z.string().max(100).optional(),
	accountNumber: z.string().max(20).optional(),
	branchCode: z.string().max(10).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
	isActive: z.boolean().optional(),
});

export const createPayslipSchema = z.object({
	employeeId: z.string().min(1, "Employee is required"),
	payPeriodStart: z.string().datetime(),
	payPeriodEnd: z.string().datetime(),
	payDate: z.string().datetime(),
	basicSalary: z.number().min(0),
	overtime: z.number().min(0).default(0),
	bonus: z.number().min(0).default(0),
	commission: z.number().min(0).default(0),
	allowances: z.number().min(0).default(0),
	pensionEmployee: z.number().min(0).default(0),
	medicalAid: z.number().min(0).default(0),
	otherDeductions: z.number().min(0).default(0),
	pensionEmployer: z.number().min(0).default(0),
});

export const updatePayslipSchema = z.object({
	status: z.enum(["DRAFT", "APPROVED", "PAID"]).optional(),
	payDate: z.string().datetime().optional(),
	overtime: z.number().min(0).optional(),
	bonus: z.number().min(0).optional(),
	commission: z.number().min(0).optional(),
	allowances: z.number().min(0).optional(),
	pensionEmployee: z.number().min(0).optional(),
	medicalAid: z.number().min(0).optional(),
	otherDeductions: z.number().min(0).optional(),
	pensionEmployer: z.number().min(0).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreatePayslipInput = z.infer<typeof createPayslipSchema>;
export type UpdatePayslipInput = z.infer<typeof updatePayslipSchema>;
