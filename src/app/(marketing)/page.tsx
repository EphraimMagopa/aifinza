import {
	ArrowRight,
	BarChart3,
	Bot,
	Calculator,
	CreditCard,
	FileText,
	PieChart,
	Shield,
	Smartphone,
	Users,
	Wallet,
	Zap,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
	return (
		<div className="flex flex-col">
			{/* Hero Section */}
			<section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center">
						<div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm mb-6">
							<span className="font-medium">Built for South African Businesses</span>
						</div>
						<h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
							Financial Management
							<span className="text-primary block mt-2">Made Simple</span>
						</h1>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
							Aifinza helps SMBs manage invoicing, expenses, SARS tax compliance, and gain
							AI-powered financial insights. Everything you need to run your business finances.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button size="lg" asChild>
								<Link href="/signup">
									Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Button size="lg" variant="outline" asChild>
								<Link href="/features">See Features</Link>
							</Button>
						</div>
						<p className="mt-4 text-sm text-muted-foreground">
							No credit card required. Free plan available.
						</p>
					</div>
				</div>
			</section>

			{/* Trusted By Section */}
			<section className="py-12 border-y bg-muted/20">
				<div className="container mx-auto px-4">
					<p className="text-center text-sm text-muted-foreground mb-6">
						Trusted by businesses across South Africa
					</p>
					<div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
						<div className="text-xl font-semibold">FNB</div>
						<div className="text-xl font-semibold">ABSA</div>
						<div className="text-xl font-semibold">Nedbank</div>
						<div className="text-xl font-semibold">Standard Bank</div>
						<div className="text-xl font-semibold">Capitec</div>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="py-20 md:py-28">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">Everything Your Business Needs</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							From invoicing to tax compliance, Aifinza has you covered with powerful features
							designed for South African businesses.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
						<FeatureCard
							icon={FileText}
							title="Professional Invoicing"
							description="Create and send beautiful, VAT-compliant invoices. Track payments and send automatic reminders."
						/>
						<FeatureCard
							icon={Wallet}
							title="Expense Tracking"
							description="Import bank statements from major SA banks. Categorize transactions automatically with AI."
						/>
						<FeatureCard
							icon={Calculator}
							title="SARS Tax Compliance"
							description="Stay compliant with VAT, PAYE, and provisional tax. Get reminders for all tax deadlines."
						/>
						<FeatureCard
							icon={Bot}
							title="AI Financial Assistant"
							description="Ask questions about your finances in plain English. Get insights and suggestions powered by AI."
						/>
						<FeatureCard
							icon={BarChart3}
							title="Financial Reports"
							description="Generate profit & loss statements, balance sheets, and tax-ready reports with one click."
						/>
						<FeatureCard
							icon={Users}
							title="Payroll Management"
							description="Calculate PAYE, UIF, and SDL automatically. Generate payslips and submit EMP201 data."
						/>
					</div>
				</div>
			</section>

			{/* SA Specific Section */}
			<section className="py-20 md:py-28 bg-muted/30">
				<div className="container mx-auto px-4">
					<div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
						<div>
							<h2 className="text-3xl md:text-4xl font-bold mb-6">
								Built for South African Tax Requirements
							</h2>
							<p className="text-lg text-muted-foreground mb-6">
								Aifinza understands the unique requirements of South African businesses. From VAT
								calculations to SARS submissions, we&apos;ve got you covered.
							</p>
							<ul className="space-y-4">
								<li className="flex items-start gap-3">
									<div className="mt-1 rounded-full bg-primary/10 p-1">
										<Shield className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="font-medium">15% VAT Calculations</p>
										<p className="text-sm text-muted-foreground">
											Automatic VAT on invoices and transactions
										</p>
									</div>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-1 rounded-full bg-primary/10 p-1">
										<Calculator className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="font-medium">PAYE Tax Tables</p>
										<p className="text-sm text-muted-foreground">
											Updated 2024/2025 tax brackets and rebates
										</p>
									</div>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-1 rounded-full bg-primary/10 p-1">
										<CreditCard className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="font-medium">Bank Statement Import</p>
										<p className="text-sm text-muted-foreground">
											Support for FNB, ABSA, Nedbank, Standard Bank, and Capitec
										</p>
									</div>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-1 rounded-full bg-primary/10 p-1">
										<FileText className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="font-medium">Tax Calendar</p>
										<p className="text-sm text-muted-foreground">
											Never miss a VAT201, EMP201, or IRP6 deadline
										</p>
									</div>
								</li>
							</ul>
						</div>
						<div className="bg-background rounded-2xl border p-8 shadow-lg">
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">VAT Period</span>
									<span className="text-sm text-muted-foreground">Nov - Dec 2024</span>
								</div>
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Output VAT</span>
										<span className="font-medium">R 45,230.00</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Input VAT</span>
										<span className="font-medium">R 18,450.00</span>
									</div>
									<div className="h-px bg-border my-2" />
									<div className="flex justify-between">
										<span className="font-medium">VAT Payable</span>
										<span className="text-lg font-bold text-primary">R 26,780.00</span>
									</div>
								</div>
								<div className="pt-4 border-t">
									<p className="text-xs text-muted-foreground">Due: 25 January 2025 (VAT201)</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* AI Section */}
			<section className="py-20 md:py-28">
				<div className="container mx-auto px-4">
					<div className="max-w-6xl mx-auto">
						<div className="text-center mb-12">
							<div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm mb-4">
								<Bot className="h-4 w-4 mr-2" />
								<span>AI-Powered</span>
							</div>
							<h2 className="text-3xl md:text-4xl font-bold mb-4">Your AI Financial Assistant</h2>
							<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
								Ask questions about your finances in plain English. Get instant answers, insights,
								and suggestions.
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-6">
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Transaction Categorization</CardTitle>
									<CardDescription>
										AI automatically categorizes your transactions based on patterns and
										descriptions.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="bg-muted rounded-lg p-3 text-sm">
										&quot;Woolworths Food&quot; → Groceries
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Financial Q&A</CardTitle>
									<CardDescription>
										Ask questions like &quot;What were my top expenses this month?&quot; and get
										instant answers.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="bg-muted rounded-lg p-3 text-sm">
										&quot;How much VAT do I owe?&quot;
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Smart Insights</CardTitle>
									<CardDescription>
										Get proactive alerts about unusual spending, cash flow predictions, and tax
										optimization.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="bg-muted rounded-lg p-3 text-sm">
										&quot;Your expenses are 20% higher than last month&quot;
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className="py-20 md:py-28 bg-muted/30">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Aifinza?</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Join thousands of South African businesses saving time and money.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
						<div className="text-center">
							<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
								<Zap className="h-6 w-6 text-primary" />
							</div>
							<h3 className="font-semibold mb-2">Save Time</h3>
							<p className="text-sm text-muted-foreground">
								Automate invoicing, categorization, and reports. Focus on growing your business.
							</p>
						</div>
						<div className="text-center">
							<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
								<Shield className="h-6 w-6 text-primary" />
							</div>
							<h3 className="font-semibold mb-2">Stay Compliant</h3>
							<p className="text-sm text-muted-foreground">
								Never miss a tax deadline. Our system keeps you SARS-compliant year-round.
							</p>
						</div>
						<div className="text-center">
							<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
								<PieChart className="h-6 w-6 text-primary" />
							</div>
							<h3 className="font-semibold mb-2">Get Insights</h3>
							<p className="text-sm text-muted-foreground">
								AI-powered analytics help you understand your finances and make better decisions.
							</p>
						</div>
						<div className="text-center">
							<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
								<Smartphone className="h-6 w-6 text-primary" />
							</div>
							<h3 className="font-semibold mb-2">Access Anywhere</h3>
							<p className="text-sm text-muted-foreground">
								Modern web app works on any device. Manage your finances from anywhere.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing Preview */}
			<section className="py-20 md:py-28">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Start free, upgrade as you grow. All plans include core features.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
						<Card>
							<CardHeader>
								<CardTitle>Free</CardTitle>
								<CardDescription>For getting started</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold mb-4">R0</div>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li>1 business</li>
									<li>50 transactions/month</li>
									<li>5 invoices/month</li>
								</ul>
							</CardContent>
						</Card>
						<Card className="border-primary shadow-lg relative">
							<div className="absolute -top-3 left-1/2 -translate-x-1/2">
								<span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
									Popular
								</span>
							</div>
							<CardHeader>
								<CardTitle>Professional</CardTitle>
								<CardDescription>For growing businesses</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold mb-4">
									R499<span className="text-base font-normal">/month</span>
								</div>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li>3 businesses</li>
									<li>Unlimited transactions</li>
									<li>Unlimited invoices</li>
									<li>AI Assistant</li>
								</ul>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Enterprise</CardTitle>
								<CardDescription>For larger teams</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold mb-4">
									R999<span className="text-base font-normal">/month</span>
								</div>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li>Unlimited businesses</li>
									<li>Unlimited everything</li>
									<li>Priority support</li>
									<li>Custom integrations</li>
								</ul>
							</CardContent>
						</Card>
					</div>

					<div className="text-center mt-8">
						<Button size="lg" asChild>
							<Link href="/pricing">View All Plans</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 md:py-28 bg-primary text-primary-foreground">
				<div className="container mx-auto px-4 text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Ready to Take Control of Your Finances?
					</h2>
					<p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
						Join thousands of South African businesses using Aifinza to simplify their financial
						management.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button size="lg" variant="secondary" asChild>
							<Link href="/signup">
								Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button size="lg" variant="outline" className="border-primary-foreground/30" asChild>
							<Link href="/contact">Contact Sales</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}

function FeatureCard({
	icon: Icon,
	title,
	description,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
}) {
	return (
		<Card className="group hover:shadow-md transition-shadow">
			<CardHeader>
				<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
					<Icon className="h-5 w-5 text-primary" />
				</div>
				<CardTitle className="text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">{description}</p>
			</CardContent>
		</Card>
	);
}
