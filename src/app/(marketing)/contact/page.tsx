"use client";

import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const contactReasons = [
	{ value: "sales", label: "Sales inquiry" },
	{ value: "support", label: "Technical support" },
	{ value: "billing", label: "Billing question" },
	{ value: "partnership", label: "Partnership opportunity" },
	{ value: "feedback", label: "Product feedback" },
	{ value: "other", label: "Other" },
];

export default function ContactPage() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		company: "",
		reason: "",
		message: "",
	});

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!formData.name || !formData.email || !formData.reason || !formData.message) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);

		// Simulate form submission
		await new Promise((resolve) => setTimeout(resolve, 1000));

		toast.success("Message sent!", {
			description: "We'll get back to you within 24 hours.",
		});

		setFormData({
			name: "",
			email: "",
			company: "",
			reason: "",
			message: "",
		});

		setIsSubmitting(false);
	}

	return (
		<div className="flex flex-col">
			{/* Hero */}
			<section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
				<div className="container mx-auto px-4">
					<div className="max-w-3xl mx-auto text-center">
						<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Get in Touch</h1>
						<p className="text-xl text-muted-foreground">
							Have a question or need help? We&apos;re here for you. Send us a message and
							we&apos;ll respond within 24 hours.
						</p>
					</div>
				</div>
			</section>

			{/* Contact Form & Info */}
			<section className="py-20 md:py-28">
				<div className="container mx-auto px-4">
					<div className="max-w-6xl mx-auto">
						<div className="grid lg:grid-cols-3 gap-12">
							{/* Contact Info */}
							<div className="lg:col-span-1 space-y-6">
								<Card>
									<CardHeader>
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
											<Mail className="h-5 w-5 text-primary" />
										</div>
										<CardTitle>Email Us</CardTitle>
										<CardDescription>For general inquiries and support</CardDescription>
									</CardHeader>
									<CardContent>
										<a href="mailto:support@aifinza.co.za" className="text-primary hover:underline">
											support@aifinza.co.za
										</a>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
											<Phone className="h-5 w-5 text-primary" />
										</div>
										<CardTitle>Call Us</CardTitle>
										<CardDescription>Mon-Fri from 8am to 5pm SAST</CardDescription>
									</CardHeader>
									<CardContent>
										<a href="tel:+27100001234" className="text-primary hover:underline">
											+27 10 000 1234
										</a>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
											<MapPin className="h-5 w-5 text-primary" />
										</div>
										<CardTitle>Visit Us</CardTitle>
										<CardDescription>Our office location</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											123 Financial Drive
											<br />
											Sandton, Johannesburg
											<br />
											Gauteng, 2196
											<br />
											South Africa
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
											<MessageSquare className="h-5 w-5 text-primary" />
										</div>
										<CardTitle>Live Chat</CardTitle>
										<CardDescription>Chat with our support team</CardDescription>
									</CardHeader>
									<CardContent>
										<Button variant="outline" size="sm">
											Start Chat
										</Button>
									</CardContent>
								</Card>
							</div>

							{/* Contact Form */}
							<div className="lg:col-span-2">
								<Card>
									<CardHeader>
										<CardTitle>Send us a Message</CardTitle>
										<CardDescription>
											Fill out the form below and we&apos;ll get back to you as soon as possible.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<form onSubmit={handleSubmit} className="space-y-6">
											<div className="grid sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="name">
														Name <span className="text-destructive">*</span>
													</Label>
													<Input
														id="name"
														placeholder="Your name"
														value={formData.name}
														onChange={(e) =>
															setFormData((prev) => ({ ...prev, name: e.target.value }))
														}
														required
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="email">
														Email <span className="text-destructive">*</span>
													</Label>
													<Input
														id="email"
														type="email"
														placeholder="you@example.com"
														value={formData.email}
														onChange={(e) =>
															setFormData((prev) => ({ ...prev, email: e.target.value }))
														}
														required
													/>
												</div>
											</div>

											<div className="grid sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="company">Company</Label>
													<Input
														id="company"
														placeholder="Your company name"
														value={formData.company}
														onChange={(e) =>
															setFormData((prev) => ({ ...prev, company: e.target.value }))
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="reason">
														Reason <span className="text-destructive">*</span>
													</Label>
													<Select
														value={formData.reason}
														onValueChange={(value) =>
															setFormData((prev) => ({ ...prev, reason: value }))
														}
													>
														<SelectTrigger id="reason">
															<SelectValue placeholder="Select a reason" />
														</SelectTrigger>
														<SelectContent>
															{contactReasons.map((reason) => (
																<SelectItem key={reason.value} value={reason.value}>
																	{reason.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
											</div>

											<div className="space-y-2">
												<Label htmlFor="message">
													Message <span className="text-destructive">*</span>
												</Label>
												<Textarea
													id="message"
													placeholder="How can we help you?"
													rows={6}
													value={formData.message}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, message: e.target.value }))
													}
													required
												/>
											</div>

											<Button type="submit" size="lg" disabled={isSubmitting}>
												{isSubmitting ? "Sending..." : "Send Message"}
											</Button>
										</form>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="py-20 md:py-28 bg-muted/30">
				<div className="container mx-auto px-4">
					<div className="max-w-3xl mx-auto">
						<div className="text-center mb-12">
							<h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
							<p className="text-muted-foreground">
								Can&apos;t find what you&apos;re looking for? Contact our support team.
							</p>
						</div>

						<div className="space-y-6">
							<div className="bg-background rounded-lg border p-6">
								<h3 className="font-semibold mb-2">How do I get started with Aifinza?</h3>
								<p className="text-muted-foreground">
									Simply sign up for a free account and follow our setup wizard. You can start with
									our Free plan and upgrade anytime as your business grows.
								</p>
							</div>

							<div className="bg-background rounded-lg border p-6">
								<h3 className="font-semibold mb-2">Can I import data from my current system?</h3>
								<p className="text-muted-foreground">
									Yes! You can import bank statements from major SA banks (FNB, ABSA, Nedbank,
									Standard Bank, Capitec) and we support CSV imports for transactions and customers.
								</p>
							</div>

							<div className="bg-background rounded-lg border p-6">
								<h3 className="font-semibold mb-2">Is my data secure?</h3>
								<p className="text-muted-foreground">
									Absolutely. We use industry-standard encryption (AES-256) for all data at rest and
									in transit. Your financial data is never shared with third parties.
								</p>
							</div>

							<div className="bg-background rounded-lg border p-6">
								<h3 className="font-semibold mb-2">Do you offer training or onboarding?</h3>
								<p className="text-muted-foreground">
									Yes! All paid plans include access to our knowledge base and video tutorials.
									Enterprise customers receive dedicated onboarding and training sessions.
								</p>
							</div>

							<div className="bg-background rounded-lg border p-6">
								<h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
								<p className="text-muted-foreground">
									We accept all major credit and debit cards through Stripe. For Enterprise plans,
									we also offer invoice-based billing.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
