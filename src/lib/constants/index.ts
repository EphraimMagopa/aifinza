// Re-export all constants
export * from "./south-africa";

// Application Constants
export const APP_NAME = "Aifinza";
export const APP_DESCRIPTION = "Comprehensive financial management platform for South African SMBs";

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
	"application/vnd.ms-excel", // xls
	"text/csv",
];

// API Rate limiting
export const RATE_LIMIT = {
	requests: 100,
	windowMs: 60 * 1000, // 1 minute
};

// Session settings
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// AI Settings
export const AI_PROVIDERS = [
	{ value: "CLAUDE", label: "Claude (Anthropic)", model: "claude-sonnet-4-20250514" },
	{ value: "OPENAI", label: "OpenAI", model: "gpt-4-turbo-preview" },
	{ value: "GEMINI", label: "Gemini (Google)", model: "gemini-pro" },
	{ value: "DEEPSEEK", label: "DeepSeek", model: "deepseek-chat" },
] as const;

// Subscription Plans
export const SUBSCRIPTION_PLANS = [
	{
		id: "FREE",
		name: "Free",
		description: "Perfect for getting started",
		price: 0,
		currency: "ZAR",
		interval: "month",
		features: [
			"1 Business",
			"100 Transactions/month",
			"5 Invoices/month",
			"Basic Reports",
			"Email Support",
		],
		limits: {
			businesses: 1,
			transactions: 100,
			invoices: 5,
			users: 1,
		},
	},
	{
		id: "STARTER",
		name: "Starter",
		description: "For growing businesses",
		price: 299,
		currency: "ZAR",
		interval: "month",
		features: [
			"1 Business",
			"500 Transactions/month",
			"50 Invoices/month",
			"All Reports",
			"Bank Import",
			"Priority Support",
		],
		limits: {
			businesses: 1,
			transactions: 500,
			invoices: 50,
			users: 3,
		},
	},
	{
		id: "PROFESSIONAL",
		name: "Professional",
		description: "For established businesses",
		price: 599,
		currency: "ZAR",
		interval: "month",
		features: [
			"3 Businesses",
			"Unlimited Transactions",
			"Unlimited Invoices",
			"All Reports",
			"AI Assistant",
			"Payroll",
			"API Access",
			"24/7 Support",
		],
		limits: {
			businesses: 3,
			transactions: -1, // Unlimited
			invoices: -1,
			users: 10,
		},
	},
	{
		id: "ENTERPRISE",
		name: "Enterprise",
		description: "For large organizations",
		price: 1499,
		currency: "ZAR",
		interval: "month",
		features: [
			"Unlimited Businesses",
			"Unlimited Everything",
			"White-label Option",
			"Dedicated Support",
			"Custom Integrations",
			"SLA Guarantee",
		],
		limits: {
			businesses: -1,
			transactions: -1,
			invoices: -1,
			users: -1,
		},
	},
] as const;
