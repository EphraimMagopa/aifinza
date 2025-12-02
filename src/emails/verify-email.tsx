import { Heading, Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

interface VerifyEmailProps {
	name: string;
	verificationUrl: string;
}

export function VerifyEmail({ name, verificationUrl }: VerifyEmailProps) {
	return (
		<EmailLayout preview="Verify your email address to complete your Aifinza registration">
			<Heading style={heading}>Verify your email address</Heading>

			<Text style={paragraph}>Hi {name},</Text>

			<Text style={paragraph}>
				Thanks for signing up for Aifinza! Please verify your email address by clicking the button
				below. This helps us ensure the security of your account.
			</Text>

			<EmailButton href={verificationUrl}>Verify Email Address</EmailButton>

			<Text style={paragraph}>This verification link will expire in 24 hours.</Text>

			<Text style={smallText}>
				If you didn't create an account with Aifinza, you can safely ignore this email. Someone
				might have entered your email address by mistake.
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
VerifyEmail.PreviewProps = {
	name: "John",
	verificationUrl: "https://aifinza.co.za/verify-email?token=abc123",
} as VerifyEmailProps;

export default VerifyEmail;

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

const smallText = {
	color: "#6b7280",
	fontSize: "14px",
	lineHeight: "22px",
	margin: "24px 0 16px",
};
