import {
	ArrowRight,
	BarChart3,
	Bot,
	Calculator,
	Calendar,
	Check,
	CreditCard,
	FileText,
	PieChart,
	Receipt,
	Shield,
	Truck,
	Upload,
	Users,
	Wallet,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
	{
		category: "Invoicing & Quotes",
		description: "Create professional invoices and quotes that get you paid faster",
		icon: FileText,
		items: [
			{
				title: "Professional Invoices",
				description:
					"Create beautiful, VAT-compliant invoices with your branding. Send directly via email with tracking.",
				features: [
					"Custom invoice templates",
					"Automatic VAT calculations (15%)",
					"Email sending with open tracking",
					"Automatic payment reminders",
					"Credit notes and refunds",
				],
			},
			{
				title: "Quote Management",
				description:
					"Send professional quotes and convert accepted ones to invoices with one click.",
				features: [
					"Quote to invoice conversion",
					"Expiry date tracking",
					"Customer approval workflow",
					"PDF generation",
					"Line item management",
				],
			},
		],
	},
	{
		category: "Banking & Transactions",
		description: "Connect your bank accounts and track every rand",
		icon: Wallet,
		items: [
			{
				title: "Bank Statement Import",
				description:
					"Import CSV statements from all major South African banks. Automatic format detection.",
				features: [
					"FNB, ABSA, Nedbank, Standard Bank, Capitec",
					"Automatic date and amount parsing",
					"Duplicate detection",
					"Bulk categorization",
					"Reconciliation tools",
				],
			},
			{
				title: "Transaction Management",
				description: "Track income and expenses with powerful filtering and categorization.",
				features: [
					"Custom categories",
					"AI-powered auto-categorization",
					"Recurring transaction detection",
					"Multi-currency support (ZAR default)",
					"Document attachments",
				],
			},
		],
	},
	{
		category: "Tax Compliance",
		description: "Stay SARS-compliant with automatic calculations and reminders",
		icon: Calculator,
		items: [
			{
				title: "VAT Management",
				description: "Track input and output VAT automatically. Generate VAT201-ready reports.",
				features: [
					"Automatic 15% VAT on invoices",
					"Zero-rated and exempt tracking",
					"Input/output VAT reconciliation",
					"VAT201 preparation",
					"Period-based reporting",
				],
			},
			{
				title: "Tax Calendar",
				description: "Never miss a deadline with automatic reminders for all SARS submissions.",
				features: [
					"VAT201 due dates",
					"EMP201 monthly submissions",
					"Provisional tax (IRP6) reminders",
					"Annual tax deadlines",
					"Custom reminder settings",
				],
			},
		],
	},
	{
		category: "Payroll",
		description: "Process payroll with automatic PAYE, UIF, and SDL calculations",
		icon: Users,
		items: [
			{
				title: "Employee Management",
				description: "Maintain complete employee records with all tax and banking details.",
				features: [
					"Employee profiles",
					"Employment history",
					"Tax number tracking",
					"Bank details storage",
					"Document uploads",
				],
			},
			{
				title: "Payroll Processing",
				description:
					"Calculate salaries with automatic deductions based on current SARS tax tables.",
				features: [
					"2024/2025 PAYE tax tables",
					"UIF calculations (1% each)",
					"SDL levy (1%)",
					"Payslip generation",
					"EMP201 data export",
				],
			},
		],
	},
	{
		category: "AI Assistant",
		description: "Get instant answers and insights powered by artificial intelligence",
		icon: Bot,
		items: [
			{
				title: "Financial Q&A",
				description:
					"Ask questions about your finances in plain English. Get instant, accurate answers.",
				features: [
					"Natural language queries",
					"Contextual understanding",
					"Conversation history",
					"Multiple AI providers",
					"Secure data handling",
				],
			},
			{
				title: "Smart Automation",
				description: "Let AI categorize transactions, detect patterns, and provide insights.",
				features: [
					"Auto-categorization",
					"Anomaly detection",
					"Cash flow predictions",
					"Tax optimization tips",
					"Spending insights",
				],
			},
		],
	},
	{
		category: "Reports & Analytics",
		description: "Understand your business with powerful financial reports",
		icon: BarChart3,
		items: [
			{
				title: "Financial Statements",
				description: "Generate professional financial reports ready for accountants and SARS.",
				features: [
					"Profit & Loss statement",
					"Balance sheet",
					"Trial balance",
					"Cash flow statement",
					"Custom date ranges",
				],
			},
			{
				title: "Business Analytics",
				description: "Track key metrics and trends to make better business decisions.",
				features: [
					"Revenue trends",
					"Expense breakdowns",
					"Customer insights",
					"Supplier analysis",
					"Export to Excel/PDF",
				],
			},
		],
	},
];

const additionalFeatures = [
	{
		icon: CreditCard,
		title: "Multiple Bank Accounts",
		description: "Manage current, savings, credit cards, and cash accounts in one place.",
	},
	{
		icon: Truck,
		title: "Supplier Management",
		description: "Track supplier details, payment terms, and outstanding balances.",
	},
	{
		icon: Receipt,
		title: "Expense Claims",
		description: "Upload receipts and link them to transactions for easy record-keeping.",
	},
	{
		icon: Calendar,
		title: "Financial Calendar",
		description: "View all deadlines, due dates, and reminders in one unified calendar.",
	},
	{
		icon: Upload,
		title: "Document Storage",
		description: "Store invoices, receipts, and tax documents organized by year.",
	},
	{
		icon: Shield,
		title: "Secure & Private",
		description: "Enterprise-grade security. Your data is encrypted and never shared.",
	},
	{
		icon: PieChart,
		title: "Chart of Accounts",
		description: "Pre-configured South African chart of accounts, fully customizable.",
	},
	{
		icon: Users,
		title: "Team Collaboration",
		description: "Invite team members with role-based access (Owner, Admin, Accountant, Viewer).",
	},
];

export default function FeaturesPage() {
	return (
		<div className="flex flex-col">
			{/* Hero */}
			<section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
				<div className="container mx-auto px-4">
					<div className="max-w-3xl mx-auto text-center">
						<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
							Powerful Features for South African Businesses
						</h1>
						<p className="text-xl text-muted-foreground mb-8">
							Everything you need to manage your business finances, stay SARS-compliant, and make
							smarter decisions with AI-powered insights.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button size="lg" asChild>
								<Link href="/signup">
									Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Button size="lg" variant="outline" asChild>
								<Link href="/pricing">View Pricing</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Main Features */}
			{features.map((section, index) => {
				const Icon = section.icon;
				return (
					<section
						key={section.category}
						className={`py-20 md:py-28 ${index % 2 === 1 ? "bg-muted/30" : ""}`}
					>
						<div className="container mx-auto px-4">
							<div className="max-w-6xl mx-auto">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
										<Icon className="h-5 w-5 text-primary" />
									</div>
									<h2 className="text-2xl md:text-3xl font-bold">{section.category}</h2>
								</div>
								<p className="text-lg text-muted-foreground mb-10 max-w-2xl">
									{section.description}
								</p>

								<div className="grid md:grid-cols-2 gap-8">
									{section.items.map((item) => (
										<Card key={item.title}>
											<CardHeader>
												<CardTitle className="text-xl">{item.title}</CardTitle>
												<CardDescription className="text-base">{item.description}</CardDescription>
											</CardHeader>
											<CardContent>
												<ul className="space-y-3">
													{item.features.map((feature) => (
														<li key={feature} className="flex items-start gap-2">
															<Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
															<span className="text-sm">{feature}</span>
														</li>
													))}
												</ul>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						</div>
					</section>
				);
			})}

			{/* Additional Features */}
			<section className="py-20 md:py-28 bg-muted/30">
				<div className="container mx-auto px-4">
					<div className="max-w-6xl mx-auto">
						<div className="text-center mb-12">
							<h2 className="text-3xl md:text-4xl font-bold mb-4">And Much More...</h2>
							<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
								Aifinza is packed with features to help you run your business efficiently.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{additionalFeatures.map((feature) => {
								const Icon = feature.icon;
								return (
									<Card key={feature.title} className="text-center">
										<CardContent className="pt-6">
											<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
												<Icon className="h-6 w-6 text-primary" />
											</div>
											<h3 className="font-semibold mb-2">{feature.title}</h3>
											<p className="text-sm text-muted-foreground">{feature.description}</p>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-20 md:py-28">
				<div className="container mx-auto px-4 text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
						Join thousands of South African businesses using Aifinza. Start your free trial today.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button size="lg" asChild>
							<Link href="/signup">
								Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button size="lg" variant="outline" asChild>
							<Link href="/contact">Contact Sales</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
