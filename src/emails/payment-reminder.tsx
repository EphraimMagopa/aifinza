import { Column, Heading, Row, Section, Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

interface PaymentReminderEmailProps {
	customerName: string;
	invoiceNumber: string;
	businessName: string;
	amount: string;
	dueDate: string;
	daysOverdue?: number;
	viewInvoiceUrl: string;
	paymentUrl: string;
}

export function PaymentReminderEmail({
	customerName,
	invoiceNumber,
	businessName,
	amount,
	dueDate,
	daysOverdue,
	viewInvoiceUrl,
	paymentUrl,
}: PaymentReminderEmailProps) {
	const isOverdue = daysOverdue !== undefined && daysOverdue > 0;

	return (
		<EmailLayout
			preview={
				isOverdue
					? `Payment overdue: Invoice ${invoiceNumber} - R${amount}`
					: `Payment reminder: Invoice ${invoiceNumber} due ${dueDate}`
			}
		>
			<Heading style={heading}>{isOverdue ? "Payment Overdue" : "Payment Reminder"}</Heading>

			<Text style={paragraph}>Hi {customerName},</Text>

			{isOverdue ? (
				<Text style={paragraph}>
					This is a friendly reminder that your invoice from {businessName} is now{" "}
					<strong>{daysOverdue} days overdue</strong>. Please arrange payment at your earliest
					convenience.
				</Text>
			) : (
				<Text style={paragraph}>
					This is a friendly reminder that payment for your invoice from {businessName} is due soon.
					Please ensure payment is made by the due date.
				</Text>
			)}

			<Section style={isOverdue ? overdueBox : invoiceBox}>
				<Row>
					<Column style={labelColumn}>Invoice Number:</Column>
					<Column style={valueColumn}>{invoiceNumber}</Column>
				</Row>
				<Row>
					<Column style={labelColumn}>Amount Due:</Column>
					<Column style={isOverdue ? overdueAmountColumn : amountColumn}>R{amount}</Column>
				</Row>
				<Row>
					<Column style={labelColumn}>Due Date:</Column>
					<Column style={isOverdue ? overdueDateColumn : valueColumn}>{dueDate}</Column>
				</Row>
				{isOverdue && (
					<Row>
						<Column style={labelColumn}>Days Overdue:</Column>
						<Column style={overdueDateColumn}>{daysOverdue} days</Column>
					</Row>
				)}
			</Section>

			<EmailButton href={paymentUrl}>Pay Now</EmailButton>

			<Text style={paragraph}>
				If you've already made this payment, please disregard this reminder. If you have any
				questions or need to discuss payment arrangements, please contact {businessName} directly.
			</Text>

			<Text style={smallText}>
				<a href={viewInvoiceUrl} style={link}>
					View full invoice details
				</a>
			</Text>

			<Text style={paragraph}>
				Thank you,
				<br />
				{businessName}
			</Text>
		</EmailLayout>
	);
}

// Default props for preview
PaymentReminderEmail.PreviewProps = {
	customerName: "Jane Smith",
	invoiceNumber: "INV-2024-001",
	businessName: "Acme Solutions",
	amount: "15,500.00",
	dueDate: "15 January 2025",
	daysOverdue: 7,
	viewInvoiceUrl: "https://aifinza.co.za/invoices/view/abc123",
	paymentUrl: "https://aifinza.co.za/pay/abc123",
} as PaymentReminderEmailProps;

export default PaymentReminderEmail;

// Styles
const heading = {
	color: "#0f172a",
	fontSize: "24px",
	fontWeight: "600",
	lineHeight: "32px",
	margin: "0 0 24px",
};

const paragraph = {
	color: "#374151",
	fontSize: "16px",
	lineHeight: "26px",
	margin: "0 0 16px",
};

const invoiceBox = {
	backgroundColor: "#f8fafc",
	borderRadius: "8px",
	margin: "24px 0",
	padding: "20px",
};

const overdueBox = {
	backgroundColor: "#fef2f2",
	borderColor: "#fecaca",
	borderRadius: "8px",
	borderStyle: "solid" as const,
	borderWidth: "1px",
	margin: "24px 0",
	padding: "20px",
};

const labelColumn = {
	color: "#6b7280",
	fontSize: "14px",
	fontWeight: "500",
	paddingBottom: "12px",
	width: "140px",
};

const valueColumn = {
	color: "#0f172a",
	fontSize: "14px",
	fontWeight: "600",
	paddingBottom: "12px",
};

const amountColumn = {
	color: "#059669",
	fontSize: "18px",
	fontWeight: "700",
	paddingBottom: "12px",
};

const overdueAmountColumn = {
	color: "#dc2626",
	fontSize: "18px",
	fontWeight: "700",
	paddingBottom: "12px",
};

const overdueDateColumn = {
	color: "#dc2626",
	fontSize: "14px",
	fontWeight: "600",
	paddingBottom: "12px",
};

const smallText = {
	color: "#6b7280",
	fontSize: "14px",
	lineHeight: "22px",
	margin: "24px 0 16px",
	textAlign: "center" as const,
};

const link = {
	color: "#556cd6",
	textDecoration: "none",
};
