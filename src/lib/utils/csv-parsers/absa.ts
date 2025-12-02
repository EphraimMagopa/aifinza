import type { BankParser, ParsedTransaction, ParseResult } from "./types";

// ABSA CSV format typically has:
// Account Number, Date, Reference Number, Description, Amount, Balance

export const absaParser: BankParser = {
	name: "ABSA",

	detect: (content: string, headers: string[]): boolean => {
		const lowerContent = content.toLowerCase();
		const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

		// Check for ABSA-specific patterns
		if (lowerContent.includes("absa")) {
			return true;
		}

		// ABSA often has "Reference Number" column
		if (lowerHeaders.some((h) => h.includes("reference number"))) {
			return true;
		}

		// Check header patterns typical for ABSA
		const absaPatterns = ["statement date", "reference number", "description", "amount"];
		const matchCount = absaPatterns.filter((pattern) =>
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
				bankName: "ABSA",
			};
		}

		// Find header row
		let headerIndex = 0;
		for (let i = 0; i < Math.min(10, lines.length); i++) {
			const line = lines[i].toLowerCase();
			if (
				(line.includes("date") && line.includes("description") && line.includes("amount")) ||
				line.includes("reference number")
			) {
				headerIndex = i;
				break;
			}
			// Check for account number
			if (/\d{10,}/.test(lines[i]) && !line.includes("date")) {
				const match = lines[i].match(/\d{10,}/);
				if (match) accountNumber = match[0];
			}
		}

		const headers = parseCSVLine(lines[headerIndex]).map((h) => h.toLowerCase().trim());

		// Find column indices
		const dateIndex = headers.findIndex(
			(h) => h.includes("date") || h.includes("statement date") || h === "date"
		);
		const descIndex = headers.findIndex((h) => h.includes("description") || h === "description");
		const amountIndex = headers.findIndex((h) => h.includes("amount") || h === "amount");
		const balanceIndex = headers.findIndex((h) => h.includes("balance") || h === "balance");
		const refIndex = headers.findIndex((h) => h.includes("reference") || h.includes("ref"));

		if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
			return {
				success: false,
				transactions: [],
				errors: ["Could not identify required columns (date, description, amount)"],
				bankName: "ABSA",
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
				const reference = refIndex >= 0 ? values[refIndex]?.trim() : null;

				if (!dateStr || !description || !amountStr) continue;

				const date = parseABSADate(dateStr);
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
					reference: reference || null,
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
			bankName: "ABSA",
			accountNumber,
			currency: "ZAR",
		};
	},
};

function parseABSADate(dateStr: string): Date | null {
	// ABSA uses formats like: 2024/01/15, 15/01/2024, 15-Jan-2024
	const formats = [
		/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/,
		/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
		/^(\d{1,2})-([a-zA-Z]{3})-(\d{4})$/,
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

	let match = dateStr.match(formats[0]);
	if (match) {
		return new Date(
			Number.parseInt(match[1], 10),
			Number.parseInt(match[2], 10) - 1,
			Number.parseInt(match[3], 10)
		);
	}

	match = dateStr.match(formats[1]);
	if (match) {
		return new Date(
			Number.parseInt(match[3], 10),
			Number.parseInt(match[2], 10) - 1,
			Number.parseInt(match[1], 10)
		);
	}

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
