// Aifinza Type Definitions

// Re-export Prisma types for convenience
export type {
	BankAccount,
	Business,
	BusinessUser,
	Category,
	ChartOfAccount,
	Customer,
	Document,
	Employee,
	Invoice,
	Payslip,
	Quote,
	Supplier,
	TaxPeriod,
	Transaction,
	User,
} from "@prisma/client";

// Enum re-exports
export {
	AccountCategory,
	AIProvider,
	BankAccountType,
	BusinessRole,
	BusinessType,
	DocumentType,
	EmploymentType,
	EventType,
	Frequency,
	InvoiceStatus,
	MessageRole,
	PayslipStatus,
	Province,
	QuoteStatus,
	SalaryType,
	SubscriptionPlan,
	SubscriptionStatus,
	TaxStatus,
	TaxType,
	TransactionType,
	UserRole,
	VatCycle,
	VatType,
} from "@prisma/client";

// API Response types
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Pagination types
export interface PaginationParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// Session types (for NextAuth)
export interface SessionUser {
	id: string;
	email: string;
	name?: string | null;
	image?: string | null;
	role: "USER" | "ADMIN" | "SUPER_ADMIN";
}

// Business context type
export interface BusinessContext {
	businessId: string;
	role: "OWNER" | "ADMIN" | "ACCOUNTANT" | "MEMBER" | "VIEWER";
}

// Form state types
export interface FormState {
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	error?: string;
}

// Currency formatting
export interface CurrencyFormat {
	code: string;
	symbol: string;
	decimals: number;
	locale: string;
}

// South African specific types
export interface SouthAfricanBank {
	value: string;
	label: string;
	branchCode: string;
}

export interface SouthAfricanProvince {
	value: string;
	label: string;
}

export interface TaxBracket {
	min: number;
	max: number;
	rate: number;
	rebate: number;
}
