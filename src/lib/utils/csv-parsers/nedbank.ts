import type { BankParser, ParsedTransaction, ParseResult } from "./types";

// Nedbank CSV format typically has:
// Transaction Date, Value Date, Transaction Description, Debit, Credit, Balance

export const nedbankParser: BankParser = {
	name: "Nedbank",

	detect: (content: string, headers: string[]): boolean => {
		const lowerContent = content.toLowerCase();
		const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

		// Check for Nedbank-specific patterns
		if (lowerContent.includes("nedbank")) {
			return true;
		}

		// Nedbank often has separate Debit and Credit columns
		const hasDebitCredit =
			lowerHeaders.some((h) => h.includes("debit")) &&
			lowerHeaders.some((h) => h.includes("credit"));

		if (hasDebitCredit) {
			return true;
		}

		// Check for "Transaction Date" and "Value Date" pattern
		const hasValueDate = lowerHeaders.some((h) => h.includes("value date"));
		const hasTransDate = lowerHeaders.some((h) => h.includes("transaction date"));

		return hasValueDate && hasTransDate;
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
				bankName: "Nedbank",
			};
		}

		// Find header row
		let headerIndex = 0;
		for (let i = 0; i < Math.min(10, lines.length); i++) {
			const line = lines[i].toLowerCase();
			if (
				(line.includes("date") && line.includes("description")) ||
				(line.includes("debit") && line.includes("credit"))
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
		const dateIndex = headers.findIndex(
			(h) => h.includes("transaction date") || h === "date" || h.includes("date")
		);
		const descIndex = headers.findIndex((h) => h.includes("description") || h === "description");
		const debitIndex = headers.findIndex((h) => h.includes("debit"));
		const creditIndex = headers.findIndex((h) => h.includes("credit"));
		const amountIndex = headers.findIndex((h) => h === "amount" || h.includes("amount"));
		const balanceIndex = headers.findIndex((h) => h.includes("balance"));

		// Nedbank uses either debit/credit columns or single amount column
		const usesDebitCredit = debitIndex !== -1 && creditIndex !== -1;

		if (dateIndex === -1 || descIndex === -1 || (!usesDebitCredit && amountIndex === -1)) {
			return {
				success: false,
				transactions: [],
				errors: ["Could not identify required columns"],
				bankName: "Nedbank",
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

				if (!dateStr || !description) continue;

				const date = parseNedbankDate(dateStr);
				if (!date) {
					errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
					continue;
				}

				let amount: number;
				let type: "INCOME" | "EXPENSE";

				if (usesDebitCredit) {
					const debitStr = values[debitIndex]?.trim();
					const creditStr = values[creditIndex]?.trim();
					const debit = debitStr ? parseAmount(debitStr) : 0;
					const credit = creditStr ? parseAmount(creditStr) : 0;

					if (credit > 0) {
						amount = credit;
						type = "INCOME";
					} else if (debit > 0) {
						amount = debit;
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
			bankName: "Nedbank",
			accountNumber,
			currency: "ZAR",
		};
	},
};

function parseNedbankDate(dateStr: string): Date | null {
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
