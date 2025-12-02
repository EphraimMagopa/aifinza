import { Button } from "@react-email/components";

interface EmailButtonProps {
	href: string;
	children: React.ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
	return (
		<Button style={button} href={href}>
			{children}
		</Button>
	);
}

const button = {
	backgroundColor: "#0f172a",
	borderRadius: "6px",
	color: "#fff",
	fontSize: "16px",
	fontWeight: "600",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	padding: "12px 24px",
	margin: "24px 0",
};
