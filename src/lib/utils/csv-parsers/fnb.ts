import type { BankParser, ParsedTransaction, ParseResult } from "./types";

// FNB CSV format typically has:
// Date, Description, Amount, Balance
// or: Account Number, Date, Description, Amount, Balance, Accrued Charges

export const fnbParser: BankParser = {
	name: "FNB (First National Bank)",

	detect: (content: string, headers: string[]): boolean => {
		const lowerContent = content.toLowerCase();
		const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

		// Check for FNB-specific patterns
		if (lowerContent.includes("fnb") || lowerContent.includes("first national bank")) {
			return true;
		}

		// Check header patterns typical for FNB
		const fnbPatterns = ["account number", "posting date", "description", "amount", "balance"];
		const matchCount = fnbPatterns.filter((pattern) =>
			lowerHeaders.some((h) => h.includes(pattern))
		).length;

		return matchCount >= 3;
	},

	parse: (content: string): ParseResult => {
		const lines = content.split(/\r?\n/).filter((line) => line.trim());
		const transactions: ParsedTransaction[] = [];
		const errors: string[] = [];
		let accountNumber: string | undefined;

		if (lines.length < 2) {
			return {
				success: false,
				transactions: [],
				errors: ["File appears to be empty or has insufficient data"],
				bankName: "FNB",
			};
		}

		// Find header row - look for common FNB headers
		let headerIndex = 0;
		for (let i = 0; i < Math.min(10, lines.length); i++) {
			const line = lines[i].toLowerCase();
			if (
				(line.includes("date") && line.includes("description") && line.includes("amount")) ||
				(line.includes("posting date") && line.includes("balance"))
			) {
				headerIndex = i;
				break;
			}
			// Check for account number line
			if (line.includes("account") && /\d{10,}/.test(lines[i])) {
				const match = lines[i].match(/\d{10,}/);
				if (match) accountNumber = match[0];
			}
		}

		const headers = parseCSVLine(lines[headerIndex]).map((h) => h.toLowerCase().trim());

		// Find column indices
		const dateIndex = headers.findIndex(
			(h) => h.includes("date") || h.includes("posting date") || h === "date"
		);
		const descIndex = headers.findIndex(
			(h) => h.includes("description") || h.includes("narrative") || h === "description"
		);
		const amountIndex = headers.findIndex(
			(h) => h.includes("amount") || h === "amount" || h.includes("money in/out")
		);
		const balanceIndex = headers.findIndex((h) => h.includes("balance") || h === "balance");

		if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
			return {
				success: false,
				transactions: [],
				errors: ["Could not identify required columns (date, description, amount)"],
				bankName: "FNB",
			};
		}

		// Parse data rows
		for (let i = headerIndex + 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			const values = parseCSVLine(line);
			if (values.length <= Math.max(dateIndex, descIndex, amountIndex)) {
				continue;
			}

			try {
				const dateStr = values[dateIndex]?.trim();
				const description = values[descIndex]?.trim();
				const amountStr = values[amountIndex]?.trim();
				const balanceStr = balanceIndex >= 0 ? values[balanceIndex]?.trim() : null;

				if (!dateStr || !description || !amountStr) continue;

				const date = parseFNBDate(dateStr);
				if (!date) {
					errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
					continue;
				}

				const amount = parseAmount(amountStr);
				if (Number.isNaN(amount)) {
					errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`);
					continue;
				}

				const balance = balanceStr ? parseAmount(balanceStr) : null;

				transactions.push({
					date,
					description,
					amount: Math.abs(amount),
					type: amount >= 0 ? "INCOME" : "EXPENSE",
					reference: null,
					balance: balance !== null && !Number.isNaN(balance) ? balance : null,
				});
			} catch (err) {
				errors.push(
					`Row ${i + 1}: Failed to parse - ${err instanceof Error ? err.message : "Unknown error"}`
				);
			}
		}

		return {
			success: transactions.length > 0,
			transactions,
			errors,
			bankName: "FNB",
			accountNumber,
			currency: "ZAR",
		};
	},
};

function parseFNBDate(dateStr: string): Date | null {
	// FNB uses formats like: 2024/01/15, 15/01/2024, 15 Jan 2024, 2024-01-15
	const formats = [
		// yyyy/mm/dd or yyyy-mm-dd
		/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/,
		// dd/mm/yyyy or dd-mm-yyyy
		/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
		// dd Mon yyyy
		/^(\d{1,2})\s+([a-zA-Z]{3})\s+(\d{4})$/,
	];

	const months: Record<string, number> = {
		jan: 0,
		feb: 1,
		mar: 2,
		apr: 3,
		may: 4,
		jun: 5,
		jul: 6,
		aug: 7,
		sep: 8,
		oct: 9,
		nov: 10,
		dec: 11,
	};

	// Try yyyy/mm/dd format
	let match = dateStr.match(formats[0]);
	if (match) {
		return new Date(
			Number.parseInt(match[1], 10),
			Number.parseInt(match[2], 10) - 1,
			Number.parseInt(match[3], 10)
		);
	}

	// Try dd/mm/yyyy format
	match = dateStr.match(formats[1]);
	if (match) {
		return new Date(
			Number.parseInt(match[3], 10),
			Number.parseInt(match[2], 10) - 1,
			Number.parseInt(match[1], 10)
		);
	}

	// Try dd Mon yyyy format
	match = dateStr.match(formats[2]);
	if (match) {
		const month = months[match[2].toLowerCase()];
		if (month !== undefined) {
			return new Date(Number.parseInt(match[3], 10), month, Number.parseInt(match[1], 10));
		}
	}

	return null;
}

function parseAmount(amountStr: string): number {
	// Remove currency symbols, spaces, and handle SA number format
	const cleaned = amountStr.replace(/[R\s]/gi, "").replace(/,/g, "").trim();
	return Number.parseFloat(cleaned);
}

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === "," && !inQuotes) {
			result.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}
	result.push(current.trim());

	return result;
}
