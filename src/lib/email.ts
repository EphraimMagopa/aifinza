import { render } from "@react-email/components";
import type { ReactElement } from "react";

import { InvoiceSentEmail } from "@/emails/invoice-sent";
import { PasswordResetEmail } from "@/emails/password-reset";
import { PaymentReminderEmail } from "@/emails/payment-reminder";
import { VerifyEmail } from "@/emails/verify-email";
import { WelcomeEmail } from "@/emails/welcome";

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || "Aifinza <noreply@aifinza.co.za>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3694";

// Email transport configuration (using Forwardemail.net SMTP)
interface EmailConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
}

function getEmailConfig(): EmailConfig {
	const port = Number.parseInt(process.env.EMAIL_SERVER_PORT || "587", 10);
	return {
		host: process.env.EMAIL_SERVER_HOST || "smtp.forwardemail.net",
		port,
		secure: port === 465,
		auth: {
			user: process.env.EMAIL_SERVER_USER || "",
			pass: process.env.EMAIL_SERVER_PASSWORD || "",
		},
	};
}

// Generic email sending function
interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
	const config = getEmailConfig();

	// In development, log emails instead of sending
	if (process.env.NODE_ENV === "development" && !process.env.EMAIL_SERVER_USER) {
		console.log("=== Email (Development Mode) ===");
		console.log(`To: ${to}`);
		console.log(`Subject: ${subject}`);
		console.log(`HTML: ${html.substring(0, 200)}...`);
		console.log("================================");
		return true;
	}

	try {
		// Dynamic import to avoid issues in edge runtime
		const nodemailer = await import("nodemailer");

		const transporter = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth: config.auth,
		});

		await transporter.sendMail({
			from: EMAIL_FROM,
			to,
			subject,
			html,
			text: text || html.replace(/<[^>]*>/g, ""),
		});

		return true;
	} catch (error) {
		console.error("Failed to send email:", error);
		return false;
	}
}

// Helper to render React Email component to HTML
async function renderEmail(component: ReactElement): Promise<string> {
	return render(component);
}

// Email sending functions for each template

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
	const html = await renderEmail(
		WelcomeEmail({
			name,
			loginUrl: `${APP_URL}/signin`,
		})
	);

	return sendEmail({
		to,
		subject: "Welcome to Aifinza!",
		html,
	});
}

export async function sendVerificationEmail(
	to: string,
	name: string,
	token: string
): Promise<boolean> {
	const html = await renderEmail(
		VerifyEmail({
			name,
			verificationUrl: `${APP_URL}/verify-email?token=${token}`,
		})
	);

	return sendEmail({
		to,
		subject: "Verify your email address - Aifinza",
		html,
	});
}

export async function sendPasswordResetEmail(
	to: string,
	name: string,
	token: string
): Promise<boolean> {
	const html = await renderEmail(
		PasswordResetEmail({
			name,
			resetUrl: `${APP_URL}/reset-password?token=${token}`,
		})
	);

	return sendEmail({
		to,
		subject: "Reset your password - Aifinza",
		html,
	});
}

interface InvoiceEmailData {
	customerEmail: string;
	customerName: string;
	invoiceNumber: string;
	businessName: string;
	amount: string;
	dueDate: string;
	invoiceId: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
	const html = await renderEmail(
		InvoiceSentEmail({
			customerName: data.customerName,
			invoiceNumber: data.invoiceNumber,
			businessName: data.businessName,
			amount: data.amount,
			dueDate: data.dueDate,
			viewInvoiceUrl: `${APP_URL}/invoices/view/${data.invoiceId}`,
			paymentUrl: `${APP_URL}/pay/${data.invoiceId}`,
		})
	);

	return sendEmail({
		to: data.customerEmail,
		subject: `Invoice ${data.invoiceNumber} from ${data.businessName}`,
		html,
	});
}

interface PaymentReminderData {
	customerEmail: string;
	customerName: string;
	invoiceNumber: string;
	businessName: string;
	amount: string;
	dueDate: string;
	daysOverdue?: number;
	invoiceId: string;
}

export async function sendPaymentReminderEmail(data: PaymentReminderData): Promise<boolean> {
	const isOverdue = data.daysOverdue !== undefined && data.daysOverdue > 0;

	const html = await renderEmail(
		PaymentReminderEmail({
			customerName: data.customerName,
			invoiceNumber: data.invoiceNumber,
			businessName: data.businessName,
			amount: data.amount,
			dueDate: data.dueDate,
			daysOverdue: data.daysOverdue,
			viewInvoiceUrl: `${APP_URL}/invoices/view/${data.invoiceId}`,
			paymentUrl: `${APP_URL}/pay/${data.invoiceId}`,
		})
	);

	const subject = isOverdue
		? `Payment overdue: Invoice ${data.invoiceNumber} from ${data.businessName}`
		: `Payment reminder: Invoice ${data.invoiceNumber} from ${data.businessName}`;

	return sendEmail({
		to: data.customerEmail,
		subject,
		html,
	});
}
