import type { BankParser, ParsedTransaction, ParseResult } from "./types";

// Capitec CSV format typically has:
// Date, Transaction Type, Description, Amount, Balance
// or: Transaction Date, Reference, Description, Money In, Money Out, Balance

export const capitecParser: BankParser = {
	name: "Capitec",

	detect: (content: string, headers: string[]): boolean => {
		const lowerContent = content.toLowerCase();
		const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

		// Check for Capitec-specific patterns
		if (lowerContent.includes("capitec")) {
			return true;
		}

		// Capitec often has "Money In" and "Money Out" columns
		const hasMoneyInOut =
			lowerHeaders.some((h) => h.includes("money in")) &&
			lowerHeaders.some((h) => h.includes("money out"));

		if (hasMoneyInOut) {
			return true;
		}

		// Check for "Transaction Type" column (Capitec specific)
		if (lowerHeaders.some((h) => h.includes("transaction type"))) {
			return true;
		}

		return false;
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
				bankName: "Capitec",
			};
		}

		// Find header row
		let headerIndex = 0;
		for (let i = 0; i < Math.min(10, lines.length); i++) {
			const line = lines[i].toLowerCase();
			if (
				(line.includes("date") && line.includes("description")) ||
				(line.includes("money in") && line.includes("money out"))
			) {
				headerIndex = i;
				break;
			}
			if (/\d{10,}/.test(lines[i]) && !line.includes("date")) {
				const match = lines[i].match(/\d{10,}/);
				if (match) accountNumber = match[0];
			}
		}

		const headers = parseCSVLine(lines[headerIndex]).map((h) => h.toLowerCase().trim());

		// Find column indices
		const dateIndex = headers.findIndex((h) => h.includes("date") || h === "date");
		const descIndex = headers.findIndex((h) => h.includes("description") || h === "description");
		const moneyInIndex = headers.findIndex((h) => h.includes("money in"));
		const moneyOutIndex = headers.findIndex((h) => h.includes("money out"));
		const amountIndex = headers.findIndex((h) => h === "amount" || h.includes("amount"));
		const balanceIndex = headers.findIndex((h) => h.includes("balance"));
		const refIndex = headers.findIndex((h) => h.includes("reference") || h.includes("ref"));

		const usesMoneyInOut = moneyInIndex !== -1 && moneyOutIndex !== -1;

		if (dateIndex === -1 || descIndex === -1 || (!usesMoneyInOut && amountIndex === -1)) {
			return {
				success: false,
				transactions: [],
				errors: ["Could not identify required columns"],
				bankName: "Capitec",
			};
		}

		// Parse data rows
		for (let i = headerIndex + 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			const values = parseCSVLine(line);
			if (values.length <= dateIndex || values.length <= descIndex) {
				continue;
			}

			try {
				const dateStr = values[dateIndex]?.trim();
				const description = values[descIndex]?.trim();
				const reference = refIndex >= 0 ? values[refIndex]?.trim() : null;

				if (!dateStr || !description) continue;

				const date = parseCapitecDate(dateStr);
				if (!date) {
					errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
					continue;
				}

				let amount: number;
				let type: "INCOME" | "EXPENSE";

				if (usesMoneyInOut) {
					const moneyInStr = values[moneyInIndex]?.trim();
					const moneyOutStr = values[moneyOutIndex]?.trim();
					const moneyIn = moneyInStr ? parseAmount(moneyInStr) : 0;
					const moneyOut = moneyOutStr ? parseAmount(moneyOutStr) : 0;

					if (moneyIn > 0) {
						amount = moneyIn;
						type = "INCOME";
					} else if (moneyOut > 0) {
						amount = moneyOut;
						type = "EXPENSE";
					} else {
						continue; // Skip rows with no amount
					}
				} else {
					const amountStr = values[amountIndex]?.trim();
					if (!amountStr) continue;

					amount = parseAmount(amountStr);
					if (Number.isNaN(amount)) {
						errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`);
						continue;
					}
					type = amount >= 0 ? "INCOME" : "EXPENSE";
					amount = Math.abs(amount);
				}

				const balanceStr = balanceIndex >= 0 ? values[balanceIndex]?.trim() : null;
				const balance = balanceStr ? parseAmount(balanceStr) : null;

				transactions.push({
					date,
					description,
					amount,
					type,
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
			bankName: "Capitec",
			accountNumber,
			currency: "ZAR",
		};
	},
};

function parseCapitecDate(dateStr: string): Date | null {
	const formats = [
		/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/,
		/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
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
