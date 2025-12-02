import { Column, Heading, Row, Section, Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

interface InvoiceSentEmailProps {
	customerName: string;
	invoiceNumber: string;
	businessName: string;
	amount: string;
	dueDate: string;
	viewInvoiceUrl: string;
	paymentUrl: string;
}

export function InvoiceSentEmail({
	customerName,
	invoiceNumber,
	businessName,
	amount,
	dueDate,
	viewInvoiceUrl,
	paymentUrl,
}: InvoiceSentEmailProps) {
	return (
		<EmailLayout
			preview={`Invoice ${invoiceNumber} from ${businessName} - R${amount} due ${dueDate}`}
		>
			<Heading style={heading}>Invoice from {businessName}</Heading>

			<Text style={paragraph}>Hi {customerName},</Text>

			<Text style={paragraph}>
				Please find attached your invoice from {businessName}. Here's a summary of your invoice:
			</Text>

			<Section style={invoiceBox}>
				<Row>
					<Column style={labelColumn}>Invoice Number:</Column>
					<Column style={valueColumn}>{invoiceNumber}</Column>
				</Row>
				<Row>
					<Column style={labelColumn}>Amount Due:</Column>
					<Column style={amountColumn}>R{amount}</Column>
				</Row>
				<Row>
					<Column style={labelColumn}>Due Date:</Column>
					<Column style={valueColumn}>{dueDate}</Column>
				</Row>
			</Section>

			<EmailButton href={viewInvoiceUrl}>View Invoice</EmailButton>

			<Text style={paragraph}>
				You can pay this invoice online by clicking the button below or using the payment details on
				the invoice.
			</Text>

			<EmailButton href={paymentUrl}>Pay Now</EmailButton>

			<Text style={smallText}>
				If you have any questions about this invoice, please contact {businessName} directly.
			</Text>

			<Text style={paragraph}>
				Thank you for your business!
				<br />
				{businessName}
			</Text>
		</EmailLayout>
	);
}

// Default props for preview
InvoiceSentEmail.PreviewProps = {
	customerName: "Jane Smith",
	invoiceNumber: "INV-2024-001",
	businessName: "Acme Solutions",
	amount: "15,500.00",
	dueDate: "15 January 2025",
	viewInvoiceUrl: "https://aifinza.co.za/invoices/view/abc123",
	paymentUrl: "https://aifinza.co.za/pay/abc123",
} as InvoiceSentEmailProps;

export default InvoiceSentEmail;

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

const smallText = {
	color: "#6b7280",
	fontSize: "14px",
	lineHeight: "22px",
	margin: "24px 0 16px",
};
