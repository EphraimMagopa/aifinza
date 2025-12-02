// Re-export all utilities
export * from "./format";

// General utility functions
export function generateId(): string {
	return crypto.randomUUID();
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function truncate(str: string, length: number): string {
	if (str.length <= length) return str;
	return `${str.slice(0, length)}...`;
}

export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function isValidSouthAfricanId(idNumber: string): boolean {
	// South African ID validation
	if (!/^\d{13}$/.test(idNumber)) return false;

	// Extract date parts (year is extracted for potential future use)
	const _year = Number.parseInt(idNumber.slice(0, 2), 10);
	const month = Number.parseInt(idNumber.slice(2, 4), 10);
	const day = Number.parseInt(idNumber.slice(4, 6), 10);

	// Basic date validation
	if (month < 1 || month > 12) return false;
	if (day < 1 || day > 31) return false;

	// Luhn algorithm check
	let sum = 0;
	for (let i = 0; i < 13; i++) {
		let digit = Number.parseInt(idNumber[i], 10);
		if (i % 2 === 1) {
			digit *= 2;
			if (digit > 9) digit -= 9;
		}
		sum += digit;
	}

	return sum % 10 === 0;
}

export function isValidVatNumber(vatNumber: string): boolean {
	// South African VAT number format: 4XXXXXXXXX (10 digits starting with 4)
	return /^4\d{9}$/.test(vatNumber.replace(/\s/g, ""));
}

export function getInitials(name: string): string {
	return name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function parseDecimal(value: string | number): number {
	if (typeof value === "number") return value;
	return Number.parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return (...args: Parameters<T>) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
	return array.reduce(
		(result, item) => {
			const groupKey = String(item[key]);
			if (!result[groupKey]) {
				result[groupKey] = [];
			}
			result[groupKey].push(item);
			return result;
		},
		{} as Record<string, T[]>
	);
}
