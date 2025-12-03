export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY" | "INTERN";
export type SalaryType = "MONTHLY" | "HOURLY" | "ANNUAL";
export type PayslipStatus = "DRAFT" | "APPROVED" | "PAID";

export interface Employee {
	id: string;
	businessId: string;
	firstName: string;
	lastName: string;
	idNumber?: string | null;
	email?: string | null;
	phone?: string | null;
	employeeNumber?: string | null;
	jobTitle?: string | null;
	department?: string | null;
	startDate: string;
	endDate?: string | null;
	employmentType: EmploymentType;
	salaryType: SalaryType;
	salaryAmount: number;
	payFrequency: string;
	taxNumber?: string | null;
	bankName?: string | null;
	accountNumber?: string | null;
	branchCode?: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	_count?: {
		payslips: number;
	};
}

export interface Payslip {
	id: string;
	employeeId: string;
	payPeriodStart: string;
	payPeriodEnd: string;
	payDate: string;
	basicSalary: number;
	overtime: number;
	bonus: number;
	commission: number;
	allowances: number;
	grossPay: number;
	paye: number;
	uif: number;
	pensionEmployee: number;
	medicalAid: number;
	otherDeductions: number;
	totalDeductions: number;
	uifEmployer: number;
	sdl: number;
	pensionEmployer: number;
	netPay: number;
	status: PayslipStatus;
	createdAt: string;
	updatedAt: string;
	employee?: Employee;
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
	FULL_TIME: "Full Time",
	PART_TIME: "Part Time",
	CONTRACT: "Contract",
	TEMPORARY: "Temporary",
	INTERN: "Intern",
};

export const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
	MONTHLY: "Monthly",
	HOURLY: "Hourly",
	ANNUAL: "Annual",
};

export const PAYSLIP_STATUS_LABELS: Record<PayslipStatus, string> = {
	DRAFT: "Draft",
	APPROVED: "Approved",
	PAID: "Paid",
};

export const PAYSLIP_STATUS_COLORS: Record<PayslipStatus, string> = {
	DRAFT: "bg-gray-500",
	APPROVED: "bg-blue-500",
	PAID: "bg-green-500",
};
