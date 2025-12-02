// South African Specific Constants for Aifinza

// VAT Rate (as of 2024)
export const VAT_RATE = 0.15; // 15%

// Payroll Rates
export const UIF_RATE_EMPLOYEE = 0.01; // 1%
export const UIF_RATE_EMPLOYER = 0.01; // 1%
export const SDL_RATE = 0.01; // 1% of payroll (Skills Development Levy)

// Tax Year (South Africa: March 1 to February 28/29)
export const TAX_YEAR_START_MONTH = 3; // March
export const TAX_YEAR_END_MONTH = 2; // February

// South African Provinces
export const PROVINCES = [
	{ value: "EASTERN_CAPE", label: "Eastern Cape" },
	{ value: "FREE_STATE", label: "Free State" },
	{ value: "GAUTENG", label: "Gauteng" },
	{ value: "KWAZULU_NATAL", label: "KwaZulu-Natal" },
	{ value: "LIMPOPO", label: "Limpopo" },
	{ value: "MPUMALANGA", label: "Mpumalanga" },
	{ value: "NORTHERN_CAPE", label: "Northern Cape" },
	{ value: "NORTH_WEST", label: "North West" },
	{ value: "WESTERN_CAPE", label: "Western Cape" },
] as const;

// South African Banks with Universal Branch Codes
export const SA_BANKS = [
	{ value: "ABSA", label: "ABSA", branchCode: "632005" },
	{ value: "AFRICAN_BANK", label: "African Bank", branchCode: "430000" },
	{ value: "BIDVEST", label: "Bidvest Bank", branchCode: "462005" },
	{ value: "CAPITEC", label: "Capitec Bank", branchCode: "470010" },
	{ value: "DISCOVERY", label: "Discovery Bank", branchCode: "679000" },
	{ value: "FNB", label: "First National Bank", branchCode: "250655" },
	{ value: "INVESTEC", label: "Investec", branchCode: "580105" },
	{ value: "NEDBANK", label: "Nedbank", branchCode: "198765" },
	{ value: "STANDARD_BANK", label: "Standard Bank", branchCode: "051001" },
	{ value: "TYME", label: "TymeBank", branchCode: "678910" },
	{ value: "OTHER", label: "Other", branchCode: "" },
] as const;

// Business Types (South African)
export const BUSINESS_TYPES = [
	{ value: "SOLE_PROPRIETOR", label: "Sole Proprietor" },
	{ value: "PARTNERSHIP", label: "Partnership" },
	{ value: "PRIVATE_COMPANY", label: "Private Company (Pty) Ltd" },
	{ value: "PUBLIC_COMPANY", label: "Public Company" },
	{ value: "CLOSE_CORPORATION", label: "Close Corporation (CC)" },
	{ value: "NON_PROFIT", label: "Non-Profit Organisation" },
	{ value: "TRUST", label: "Trust" },
	{ value: "OTHER", label: "Other" },
] as const;

// VAT Cycles
export const VAT_CYCLES = [
	{
		value: "MONTHLY",
		label: "Monthly (Category A)",
		description: "Turnover > R30 million",
	},
	{
		value: "BI_MONTHLY",
		label: "Bi-Monthly (Category B)",
		description: "Turnover R1.5m - R30m",
	},
	{
		value: "SIX_MONTHLY",
		label: "Six-Monthly (Category C)",
		description: "Turnover < R1.5m (voluntary)",
	},
] as const;

// PAYE Tax Brackets (2024/2025 Tax Year)
export const PAYE_TAX_BRACKETS = [
	{ min: 0, max: 237100, rate: 0.18, rebate: 0 },
	{ min: 237101, max: 370500, rate: 0.26, rebate: 42678 },
	{ min: 370501, max: 512800, rate: 0.31, rebate: 77362 },
	{ min: 512801, max: 673000, rate: 0.36, rebate: 121475 },
	{ min: 673001, max: 857900, rate: 0.39, rebate: 179147 },
	{ min: 857901, max: 1817000, rate: 0.41, rebate: 251258 },
	{ min: 1817001, max: Number.POSITIVE_INFINITY, rate: 0.45, rebate: 644489 },
] as const;

// Tax Rebates (2024/2025)
export const TAX_REBATES = {
	primary: 17235, // All taxpayers
	secondary: 9444, // 65 and older
	tertiary: 3145, // 75 and older
} as const;

// Tax Thresholds (2024/2025) - Below these amounts, no tax is payable
export const TAX_THRESHOLDS = {
	under65: 95750,
	aged65to74: 148217,
	aged75plus: 165689,
} as const;

// Medical Aid Tax Credits (2024/2025)
export const MEDICAL_AID_CREDITS = {
	mainMember: 364, // Per month
	firstDependant: 364, // Per month
	additionalDependants: 246, // Per month per dependant
} as const;

// Default Chart of Accounts Categories
export const DEFAULT_ACCOUNT_CATEGORIES = [
	// Assets (1000-1999)
	{ code: "1000", name: "Bank Accounts", type: "ASSET", subType: "Current Assets" },
	{ code: "1100", name: "Accounts Receivable", type: "ASSET", subType: "Current Assets" },
	{ code: "1200", name: "Inventory", type: "ASSET", subType: "Current Assets" },
	{ code: "1300", name: "Prepaid Expenses", type: "ASSET", subType: "Current Assets" },
	{ code: "1500", name: "Fixed Assets", type: "ASSET", subType: "Non-Current Assets" },
	{ code: "1600", name: "Accumulated Depreciation", type: "ASSET", subType: "Non-Current Assets" },

	// Liabilities (2000-2999)
	{ code: "2000", name: "Accounts Payable", type: "LIABILITY", subType: "Current Liabilities" },
	{ code: "2100", name: "VAT Payable", type: "LIABILITY", subType: "Current Liabilities" },
	{ code: "2200", name: "PAYE Payable", type: "LIABILITY", subType: "Current Liabilities" },
	{ code: "2300", name: "UIF Payable", type: "LIABILITY", subType: "Current Liabilities" },
	{ code: "2400", name: "Accrued Expenses", type: "LIABILITY", subType: "Current Liabilities" },
	{ code: "2500", name: "Loans Payable", type: "LIABILITY", subType: "Long-term Liabilities" },

	// Equity (3000-3999)
	{ code: "3000", name: "Share Capital", type: "EQUITY", subType: "Owner's Equity" },
	{ code: "3100", name: "Retained Earnings", type: "EQUITY", subType: "Owner's Equity" },
	{ code: "3200", name: "Owner's Drawings", type: "EQUITY", subType: "Owner's Equity" },

	// Revenue (4000-4999)
	{ code: "4000", name: "Sales Revenue", type: "REVENUE", subType: "Operating Revenue" },
	{ code: "4100", name: "Service Revenue", type: "REVENUE", subType: "Operating Revenue" },
	{ code: "4200", name: "Interest Income", type: "OTHER_INCOME", subType: "Other Income" },
	{ code: "4300", name: "Other Income", type: "OTHER_INCOME", subType: "Other Income" },

	// Cost of Sales (5000-5999)
	{ code: "5000", name: "Cost of Goods Sold", type: "COST_OF_SALES", subType: "Direct Costs" },
	{ code: "5100", name: "Direct Labour", type: "COST_OF_SALES", subType: "Direct Costs" },
	{ code: "5200", name: "Subcontractors", type: "COST_OF_SALES", subType: "Direct Costs" },

	// Operating Expenses (6000-6999)
	{ code: "6000", name: "Salaries & Wages", type: "EXPENSE", subType: "Employment Costs" },
	{ code: "6100", name: "Rent", type: "EXPENSE", subType: "Occupancy Costs" },
	{ code: "6200", name: "Utilities", type: "EXPENSE", subType: "Occupancy Costs" },
	{ code: "6300", name: "Insurance", type: "EXPENSE", subType: "Administrative" },
	{ code: "6400", name: "Professional Fees", type: "EXPENSE", subType: "Administrative" },
	{ code: "6500", name: "Office Supplies", type: "EXPENSE", subType: "Administrative" },
	{ code: "6600", name: "Marketing & Advertising", type: "EXPENSE", subType: "Marketing" },
	{ code: "6700", name: "Travel & Entertainment", type: "EXPENSE", subType: "Administrative" },
	{ code: "6800", name: "Depreciation", type: "EXPENSE", subType: "Non-Cash" },
	{ code: "6900", name: "Bank Charges", type: "EXPENSE", subType: "Financial" },

	// Other Expenses (7000-7999)
	{ code: "7000", name: "Interest Expense", type: "OTHER_EXPENSE", subType: "Financial" },
	{ code: "7100", name: "Bad Debts", type: "OTHER_EXPENSE", subType: "Non-Operating" },
] as const;

// Default Transaction Categories
export const DEFAULT_CATEGORIES = {
	income: [
		{ name: "Sales", color: "#22c55e", icon: "receipt" },
		{ name: "Services", color: "#10b981", icon: "briefcase" },
		{ name: "Interest", color: "#06b6d4", icon: "percent" },
		{ name: "Refunds Received", color: "#0ea5e9", icon: "rotate-ccw" },
		{ name: "Other Income", color: "#8b5cf6", icon: "plus-circle" },
	],
	expense: [
		{ name: "Office Supplies", color: "#f59e0b", icon: "paperclip" },
		{ name: "Rent", color: "#ef4444", icon: "home" },
		{ name: "Utilities", color: "#f97316", icon: "zap" },
		{ name: "Insurance", color: "#ec4899", icon: "shield" },
		{ name: "Salaries & Wages", color: "#8b5cf6", icon: "users" },
		{ name: "Travel", color: "#6366f1", icon: "plane" },
		{ name: "Marketing", color: "#14b8a6", icon: "megaphone" },
		{ name: "Professional Fees", color: "#84cc16", icon: "scale" },
		{ name: "Bank Charges", color: "#64748b", icon: "landmark" },
		{ name: "Subscriptions", color: "#a855f7", icon: "credit-card" },
		{ name: "Equipment", color: "#0ea5e9", icon: "monitor" },
		{ name: "Meals & Entertainment", color: "#f43f5e", icon: "utensils" },
		{ name: "Vehicle Expenses", color: "#22d3ee", icon: "car" },
		{ name: "Other Expenses", color: "#78716c", icon: "minus-circle" },
	],
} as const;

// Currency
export const ZAR_CURRENCY = {
	code: "ZAR",
	symbol: "R",
	name: "South African Rand",
	decimals: 2,
	locale: "en-ZA",
} as const;

// Payment Terms Options
export const PAYMENT_TERMS_OPTIONS = [
	{ value: 0, label: "Due on Receipt" },
	{ value: 7, label: "Net 7 Days" },
	{ value: 14, label: "Net 14 Days" },
	{ value: 30, label: "Net 30 Days" },
	{ value: 45, label: "Net 45 Days" },
	{ value: 60, label: "Net 60 Days" },
	{ value: 90, label: "Net 90 Days" },
] as const;
