import { Heading, Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

interface PasswordResetEmailProps {
	name: string;
	resetUrl: string;
}

export function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
	return (
		<EmailLayout preview="Reset your Aifinza password">
			<Heading style={heading}>Reset your password</Heading>

			<Text style={paragraph}>Hi {name},</Text>

			<Text style={paragraph}>
				We received a request to reset your Aifinza password. Click the button below to choose a new
				password.
			</Text>

			<EmailButton href={resetUrl}>Reset Password</EmailButton>

			<Text style={paragraph}>This password reset link will expire in 1 hour.</Text>

			<Text style={warningBox}>
				<strong>Security tip:</strong> If you didn't request a password reset, please ignore this
				email. Your password will remain unchanged. If you're concerned about your account security,
				please contact our support team.
			</Text>

			<Text style={paragraph}>
				Best regards,
				<br />
				The Aifinza Team
			</Text>
		</EmailLayout>
	);
}

// Default props for preview
PasswordResetEmail.PreviewProps = {
	name: "John",
	resetUrl: "https://aifinza.co.za/reset-password?token=abc123",
} as PasswordResetEmailProps;

export default PasswordResetEmail;

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

const warningBox = {
	backgroundColor: "#fef3c7",
	borderRadius: "6px",
	color: "#92400e",
	fontSize: "14px",
	lineHeight: "22px",
	margin: "24px 0",
	padding: "16px",
};
