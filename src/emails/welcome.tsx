import { Heading, Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

interface WelcomeEmailProps {
	name: string;
	loginUrl: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
	return (
		<EmailLayout preview="Welcome to Aifinza - Your financial management journey starts here">
			<Heading style={heading}>Welcome to Aifinza, {name}!</Heading>

			<Text style={paragraph}>
				Thank you for joining Aifinza. We're excited to help you take control of your business
				finances with our comprehensive financial management platform built specifically for South
				African SMBs.
			</Text>

			<Text style={paragraph}>With Aifinza, you can:</Text>

			<Text style={listItem}>• Track income and expenses in real-time</Text>
			<Text style={listItem}>• Create and send professional invoices</Text>
			<Text style={listItem}>• Stay compliant with SARS tax requirements</Text>
			<Text style={listItem}>• Get AI-powered financial insights</Text>
			<Text style={listItem}>• Manage payroll and employee information</Text>

			<EmailButton href={loginUrl}>Get Started</EmailButton>

			<Text style={paragraph}>
				If you have any questions, our support team is here to help. Simply reply to this email or
				visit our help center.
			</Text>

			<Text style={paragraph}>
				Welcome aboard!
				<br />
				The Aifinza Team
			</Text>
		</EmailLayout>
	);
}

// Default props for preview
WelcomeEmail.PreviewProps = {
	name: "John",
	loginUrl: "https://aifinza.co.za/signin",
} as WelcomeEmailProps;

export default WelcomeEmail;

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

const listItem = {
	color: "#374151",
	fontSize: "16px",
	lineHeight: "24px",
	margin: "0 0 8px",
	paddingLeft: "8px",
};
