export interface ParsedTransaction {
	date: Date;
	description: string;
	amount: number;
	type: "INCOME" | "EXPENSE";
	reference: string | null;
	balance: number | null;
}

export interface ParseResult {
	success: boolean;
	transactions: ParsedTransaction[];
	errors: string[];
	bankName: string;
	accountNumber?: string;
	currency?: string;
}

export interface BankParser {
	name: string;
	detect: (content: string, headers: string[]) => boolean;
	parse: (content: string) => ParseResult;
}
