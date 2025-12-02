import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const connectionString =
	process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/aifinza";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("🌱 Starting seed...");

	// Create admin user
	const adminPassword = await bcrypt.hash("Admin123!", 12);
	const admin = await prisma.user.upsert({
		where: { email: "admin@aifinza.co.za" },
		update: {},
		create: {
			email: "admin@aifinza.co.za",
			name: "Admin User",
			password: adminPassword,
			role: "ADMIN",
			emailVerified: new Date(),
		},
	});
	console.log(`✅ Created admin user: ${admin.email}`);

	// Create demo user
	const demoPassword = await bcrypt.hash("Demo123!", 12);
	const demoUser = await prisma.user.upsert({
		where: { email: "demo@aifinza.co.za" },
		update: {},
		create: {
			email: "demo@aifinza.co.za",
			name: "Demo User",
			password: demoPassword,
			role: "USER",
			emailVerified: new Date(),
		},
	});
	console.log(`✅ Created demo user: ${demoUser.email}`);

	// Create subscription for demo user
	await prisma.subscription.upsert({
		where: { userId: demoUser.id },
		update: {},
		create: {
			userId: demoUser.id,
			plan: "PROFESSIONAL",
			status: "ACTIVE",
		},
	});
	console.log("✅ Created demo user subscription");

	// Create demo business
	const demoBusiness = await prisma.business.upsert({
		where: { id: "demo-business-id" },
		update: {},
		create: {
			id: "demo-business-id",
			name: "Acme Solutions (Pty) Ltd",
			tradingName: "Acme Solutions",
			registrationNumber: "2020/123456/07",
			taxNumber: "9123456789",
			vatNumber: "4123456789",
			isVatRegistered: true,
			vatCycle: "MONTHLY",
			businessType: "PRIVATE_COMPANY",
			industry: "Technology",
			financialYearEnd: 2, // February
			email: "info@acmesolutions.co.za",
			phone: "+27 11 123 4567",
			website: "https://acmesolutions.co.za",
			addressLine1: "123 Innovation Drive",
			addressLine2: "Tech Park",
			city: "Johannesburg",
			province: "GAUTENG",
			postalCode: "2000",
			country: "South Africa",
			defaultCurrency: "ZAR",
			invoicePrefix: "INV",
			quotePrefix: "QUO",
			nextInvoiceNumber: 1001,
			nextQuoteNumber: 501,
		},
	});
	console.log(`✅ Created demo business: ${demoBusiness.name}`);

	// Link demo user to business as owner
	await prisma.businessUser.upsert({
		where: {
			userId_businessId: {
				userId: demoUser.id,
				businessId: demoBusiness.id,
			},
		},
		update: {},
		create: {
			userId: demoUser.id,
			businessId: demoBusiness.id,
			role: "OWNER",
		},
	});
	console.log("✅ Linked demo user to business as owner");

	// Create bank accounts for demo business
	const bankAccounts = [
		{
			id: "bank-account-fnb",
			businessId: demoBusiness.id,
			name: "FNB Business Account",
			bankName: "First National Bank",
			accountNumber: "62123456789",
			branchCode: "250655",
			accountType: "CURRENT" as const,
			currentBalance: 125000.0,
		},
		{
			id: "bank-account-savings",
			businessId: demoBusiness.id,
			name: "FNB Savings Account",
			bankName: "First National Bank",
			accountNumber: "62987654321",
			branchCode: "250655",
			accountType: "SAVINGS" as const,
			currentBalance: 50000.0,
		},
	];

	for (const account of bankAccounts) {
		await prisma.bankAccount.upsert({
			where: { id: account.id },
			update: {},
			create: account,
		});
	}
	console.log("✅ Created bank accounts");

	// Create chart of accounts with SA defaults
	const chartOfAccounts = [
		// Assets
		{ code: "1000", name: "Cash on Hand", type: "ASSET" as const, subType: "CURRENT_ASSET" },
		{ code: "1100", name: "Bank Accounts", type: "ASSET" as const, subType: "CURRENT_ASSET" },
		{ code: "1200", name: "Accounts Receivable", type: "ASSET" as const, subType: "CURRENT_ASSET" },
		{ code: "1300", name: "Inventory", type: "ASSET" as const, subType: "CURRENT_ASSET" },
		{ code: "1400", name: "Prepaid Expenses", type: "ASSET" as const, subType: "CURRENT_ASSET" },
		{ code: "1500", name: "Equipment", type: "ASSET" as const, subType: "FIXED_ASSET" },
		{
			code: "1510",
			name: "Accumulated Depreciation - Equipment",
			type: "ASSET" as const,
			subType: "FIXED_ASSET",
		},
		{ code: "1600", name: "Vehicles", type: "ASSET" as const, subType: "FIXED_ASSET" },
		{
			code: "1610",
			name: "Accumulated Depreciation - Vehicles",
			type: "ASSET" as const,
			subType: "FIXED_ASSET",
		},

		// Liabilities
		{
			code: "2000",
			name: "Accounts Payable",
			type: "LIABILITY" as const,
			subType: "CURRENT_LIABILITY",
		},
		{ code: "2100", name: "VAT Payable", type: "LIABILITY" as const, subType: "CURRENT_LIABILITY" },
		{
			code: "2200",
			name: "PAYE Payable",
			type: "LIABILITY" as const,
			subType: "CURRENT_LIABILITY",
		},
		{ code: "2300", name: "UIF Payable", type: "LIABILITY" as const, subType: "CURRENT_LIABILITY" },
		{ code: "2400", name: "SDL Payable", type: "LIABILITY" as const, subType: "CURRENT_LIABILITY" },
		{
			code: "2500",
			name: "Loans Payable",
			type: "LIABILITY" as const,
			subType: "LONG_TERM_LIABILITY",
		},

		// Equity
		{ code: "3000", name: "Share Capital", type: "EQUITY" as const, subType: "EQUITY" },
		{ code: "3100", name: "Retained Earnings", type: "EQUITY" as const, subType: "EQUITY" },
		{ code: "3200", name: "Drawings", type: "EQUITY" as const, subType: "EQUITY" },

		// Revenue
		{ code: "4000", name: "Sales Revenue", type: "REVENUE" as const, subType: "REVENUE" },
		{ code: "4100", name: "Service Revenue", type: "REVENUE" as const, subType: "REVENUE" },
		{ code: "4200", name: "Interest Income", type: "REVENUE" as const, subType: "OTHER_INCOME" },
		{ code: "4300", name: "Other Income", type: "REVENUE" as const, subType: "OTHER_INCOME" },

		// Cost of Sales
		{
			code: "5000",
			name: "Cost of Goods Sold",
			type: "EXPENSE" as const,
			subType: "COST_OF_SALES",
		},
		{ code: "5100", name: "Direct Labour", type: "EXPENSE" as const, subType: "COST_OF_SALES" },

		// Operating Expenses
		{
			code: "6000",
			name: "Salaries and Wages",
			type: "EXPENSE" as const,
			subType: "OPERATING_EXPENSE",
		},
		{ code: "6100", name: "Rent Expense", type: "EXPENSE" as const, subType: "OPERATING_EXPENSE" },
		{ code: "6200", name: "Utilities", type: "EXPENSE" as const, subType: "OPERATING_EXPENSE" },
		{ code: "6300", name: "Insurance", type: "EXPENSE" as const, subType: "OPERATING_EXPENSE" },
		{
			code: "6400",
			name: "Office Supplies",
			type: "EXPENSE" as const,
			subType: "OPERATING_EXPENSE",
		},
		{
			code: "6500",
			name: "Professional Fees",
			type: "EXPENSE" as const,
			subType: "OPERATING_EXPENSE",
		},
		{
			code: "6600",
			name: "Advertising and Marketing",
			type: "EXPENSE" as const,
			subType: "OPERATING_EXPENSE",
		},
		{
			code: "6700",
			name: "Travel and Entertainment",
			type: "EXPENSE" as const,
			subType: "OPERATING_EXPENSE",
		},
		{
			code: "6800",
			name: "Depreciation Expense",
			type: "EXPENSE" as const,
			subType: "OPERATING_EXPENSE",
		},
		{ code: "6900", name: "Bank Charges", type: "EXPENSE" as const, subType: "OPERATING_EXPENSE" },
		{ code: "7000", name: "Interest Expense", type: "EXPENSE" as const, subType: "OTHER_EXPENSE" },
	];

	for (const account of chartOfAccounts) {
		await prisma.chartOfAccount.upsert({
			where: {
				businessId_code: {
					businessId: demoBusiness.id,
					code: account.code,
				},
			},
			update: {},
			create: {
				businessId: demoBusiness.id,
				...account,
				isSystem: true,
			},
		});
	}
	console.log("✅ Created chart of accounts");

	// Create categories
	const categories = [
		// Income categories
		{ name: "Sales", type: "INCOME" as const },
		{ name: "Services", type: "INCOME" as const },
		{ name: "Interest", type: "INCOME" as const },
		{ name: "Other Income", type: "INCOME" as const },

		// Expense categories
		{ name: "Advertising", type: "EXPENSE" as const },
		{ name: "Bank Fees", type: "EXPENSE" as const },
		{ name: "Equipment", type: "EXPENSE" as const },
		{ name: "Insurance", type: "EXPENSE" as const },
		{ name: "Internet & Phone", type: "EXPENSE" as const },
		{ name: "Legal & Professional", type: "EXPENSE" as const },
		{ name: "Office Supplies", type: "EXPENSE" as const },
		{ name: "Rent", type: "EXPENSE" as const },
		{ name: "Salaries & Wages", type: "EXPENSE" as const },
		{ name: "Software & Subscriptions", type: "EXPENSE" as const },
		{ name: "Travel", type: "EXPENSE" as const },
		{ name: "Utilities", type: "EXPENSE" as const },
		{ name: "Vehicle Expenses", type: "EXPENSE" as const },
		{ name: "Other Expenses", type: "EXPENSE" as const },
	];

	for (const category of categories) {
		await prisma.category.upsert({
			where: {
				businessId_name: {
					businessId: demoBusiness.id,
					name: category.name,
				},
			},
			update: {},
			create: {
				businessId: demoBusiness.id,
				...category,
				isSystem: true,
			},
		});
	}
	console.log("✅ Created categories");

	// Create sample customers
	const customers = [
		{
			id: "customer-techcorp",
			businessId: demoBusiness.id,
			name: "TechCorp Solutions",
			email: "john@techcorp.co.za",
			phone: "+27 11 555 1234",
			addressLine1: "456 Tech Street",
			city: "Sandton",
			province: "GAUTENG" as const,
			postalCode: "2196",
			country: "South Africa",
			vatNumber: "4987654321",
			paymentTerms: 30,
		},
		{
			id: "customer-greenleaf",
			businessId: demoBusiness.id,
			name: "GreenLeaf Consulting",
			email: "sarah@greenleaf.co.za",
			phone: "+27 21 555 5678",
			addressLine1: "789 Green Avenue",
			city: "Cape Town",
			province: "WESTERN_CAPE" as const,
			postalCode: "8001",
			country: "South Africa",
			paymentTerms: 14,
		},
		{
			id: "customer-blueskies",
			businessId: demoBusiness.id,
			name: "Blue Skies Trading",
			email: "mike@blueskies.co.za",
			phone: "+27 31 555 9012",
			addressLine1: "321 Ocean Drive",
			city: "Durban",
			province: "KWAZULU_NATAL" as const,
			postalCode: "4001",
			country: "South Africa",
			paymentTerms: 30,
		},
	];

	for (const customer of customers) {
		await prisma.customer.upsert({
			where: { id: customer.id },
			update: {},
			create: customer,
		});
	}
	console.log("✅ Created sample customers");

	// Create sample suppliers
	const suppliers = [
		{
			id: "supplier-officemax",
			businessId: demoBusiness.id,
			name: "OfficeMax Supplies",
			email: "orders@officemax.co.za",
			phone: "+27 11 555 3456",
			addressLine1: "100 Industrial Road",
			city: "Johannesburg",
			province: "GAUTENG" as const,
			postalCode: "2000",
			country: "South Africa",
			vatNumber: "4123456789",
			paymentTerms: 30,
		},
		{
			id: "supplier-cloudhost",
			businessId: demoBusiness.id,
			name: "CloudHost SA",
			email: "billing@cloudhost.co.za",
			phone: "+27 21 555 7890",
			addressLine1: "200 Data Centre Way",
			city: "Cape Town",
			province: "WESTERN_CAPE" as const,
			postalCode: "8001",
			country: "South Africa",
			paymentTerms: 14,
		},
	];

	for (const supplier of suppliers) {
		await prisma.supplier.upsert({
			where: { id: supplier.id },
			update: {},
			create: supplier,
		});
	}
	console.log("✅ Created sample suppliers");

	console.log("🎉 Seed completed successfully!");
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
