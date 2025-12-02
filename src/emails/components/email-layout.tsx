import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
	preview: string;
	children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={main}>
				<Container style={container}>
					{/* Header */}
					<Section style={header}>
						<Img
							src="https://aifinza.co.za/logo.png"
							width="140"
							height="40"
							alt="Aifinza"
							style={logo}
						/>
					</Section>

					{/* Content */}
					<Section style={content}>{children}</Section>

					{/* Footer */}
					<Hr style={hr} />
					<Section style={footer}>
						<Text style={footerText}>Aifinza - Financial Management for South African SMBs</Text>
						<Text style={footerLinks}>
							<Link href="https://aifinza.co.za" style={link}>
								Website
							</Link>
							{" • "}
							<Link href="https://aifinza.co.za/help" style={link}>
								Help Center
							</Link>
							{" • "}
							<Link href="https://aifinza.co.za/privacy" style={link}>
								Privacy Policy
							</Link>
						</Text>
						<Text style={footerAddress}>
							© {new Date().getFullYear()} Aifinza. All rights reserved.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// Styles
const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
	maxWidth: "600px",
};

const header = {
	padding: "32px 48px 24px",
};

const logo = {
	margin: "0 auto",
};

const content = {
	padding: "0 48px",
};

const hr = {
	borderColor: "#e6ebf1",
	margin: "32px 0",
};

const footer = {
	padding: "0 48px",
};

const footerText = {
	color: "#8898aa",
	fontSize: "14px",
	lineHeight: "24px",
	textAlign: "center" as const,
	margin: "0 0 8px",
};

const footerLinks = {
	color: "#8898aa",
	fontSize: "12px",
	lineHeight: "20px",
	textAlign: "center" as const,
	margin: "0 0 8px",
};

const footerAddress = {
	color: "#8898aa",
	fontSize: "12px",
	lineHeight: "20px",
	textAlign: "center" as const,
	margin: "0",
};

const link = {
	color: "#556cd6",
	textDecoration: "none",
};
