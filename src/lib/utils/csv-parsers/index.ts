import { absaParser } from "./absa";
import { capitecParser } from "./capitec";
import { fnbParser } from "./fnb";
import { nedbankParser } from "./nedbank";
import { standardBankParser } from "./standard-bank";
import type { BankParser, ParseResult } from "./types";

export type { BankParser, ParsedTransaction, ParseResult } from "./types";

// Register all bank parsers in order of specificity
const parsers: BankParser[] = [
	fnbParser,
	absaParser,
	nedbankParser,
	capitecParser,
	standardBankParser, // Most generic, should be last
];

/**
 * Auto-detect the bank from CSV content and parse transactions
 */
export function parseCSV(content: string): ParseResult {
	if (!content.trim()) {
		return {
			success: false,
			transactions: [],
			errors: ["File is empty"],
			bankName: "Unknown",
		};
	}

	const lines = content.split(/\r?\n/).filter((line) => line.trim());
	if (lines.length < 2) {
		return {
			success: false,
			transactions: [],
			errors: ["File has insufficient data"],
			bankName: "Unknown",
		};
	}

	// Get potential headers from first few lines
	const headerCandidates: string[][] = [];
	for (let i = 0; i < Math.min(5, lines.length); i++) {
		headerCandidates.push(parseCSVLine(lines[i]));
	}

	// Try each parser
	for (const parser of parsers) {
		for (const headers of headerCandidates) {
			if (parser.detect(content, headers)) {
				const result = parser.parse(content);
				if (result.success) {
					return result;
				}
			}
		}
	}

	// Try to use the most generic parser if nothing detected
	const genericResult = standardBankParser.parse(content);
	if (genericResult.success) {
		return {
			...genericResult,
			bankName: "Unknown (Generic)",
		};
	}

	return {
		success: false,
		transactions: [],
		errors: ["Could not parse file. Please ensure it is a valid bank statement CSV."],
		bankName: "Unknown",
	};
}

/**
 * Parse CSV with a specific bank parser
 */
export function parseCSVWithBank(content: string, bankName: string): ParseResult {
	const parserMap: Record<string, BankParser> = {
		fnb: fnbParser,
		absa: absaParser,
		nedbank: nedbankParser,
		capitec: capitecParser,
		"standard-bank": standardBankParser,
		standardbank: standardBankParser,
	};

	const parser = parserMap[bankName.toLowerCase().replace(/\s+/g, "-")];
	if (!parser) {
		return {
			success: false,
			transactions: [],
			errors: [`Unknown bank: ${bankName}`],
			bankName,
		};
	}

	return parser.parse(content);
}

/**
 * Get list of supported banks
 */
export function getSupportedBanks(): { id: string; name: string }[] {
	return [
		{ id: "fnb", name: "FNB (First National Bank)" },
		{ id: "absa", name: "ABSA" },
		{ id: "nedbank", name: "Nedbank" },
		{ id: "standard-bank", name: "Standard Bank" },
		{ id: "capitec", name: "Capitec" },
	];
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
