import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="border-b">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<Link href="/" className="text-xl font-bold">
						Aifinza
					</Link>
					<nav className="hidden md:flex items-center gap-6">
						<Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
							Features
						</Link>
						<Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
							Pricing
						</Link>
						<Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
							Contact
						</Link>
					</nav>
					<div className="flex items-center gap-4">
						<Button variant="ghost" asChild>
							<Link href="/signin">Sign In</Link>
						</Button>
						<Button asChild>
							<Link href="/signup">Get Started</Link>
						</Button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1">{children}</main>

			{/* Footer */}
			<footer className="border-t py-8">
				<div className="container mx-auto px-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
						<div>
							<h4 className="font-semibold mb-4">Product</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<Link href="/features" className="hover:text-foreground">
										Features
									</Link>
								</li>
								<li>
									<Link href="/pricing" className="hover:text-foreground">
										Pricing
									</Link>
								</li>
								<li>
									<Link href="/demo" className="hover:text-foreground">
										Demo
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-4">Company</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<Link href="/about" className="hover:text-foreground">
										About
									</Link>
								</li>
								<li>
									<Link href="/contact" className="hover:text-foreground">
										Contact
									</Link>
								</li>
								<li>
									<Link href="/careers" className="hover:text-foreground">
										Careers
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-4">Resources</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<Link href="/blog" className="hover:text-foreground">
										Blog
									</Link>
								</li>
								<li>
									<Link href="/docs" className="hover:text-foreground">
										Documentation
									</Link>
								</li>
								<li>
									<Link href="/support" className="hover:text-foreground">
										Support
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-4">Legal</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<Link href="/privacy" className="hover:text-foreground">
										Privacy Policy
									</Link>
								</li>
								<li>
									<Link href="/terms" className="hover:text-foreground">
										Terms of Service
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
						© {new Date().getFullYear()} Aifinza. All rights reserved.
					</div>
				</div>
			</footer>
		</div>
	);
}
