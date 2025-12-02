import { format, formatDistanceToNow, parseISO } from "date-fns";
import Decimal from "decimal.js";

// Currency formatting for South African Rand
export function formatCurrency(
	amount: number | string | Decimal,
	options: {
		currency?: string;
		showSymbol?: boolean;
		decimals?: number;
	} = {}
): string {
	const { currency = "ZAR", showSymbol = true, decimals = 2 } = options;

	const numericAmount = amount instanceof Decimal ? amount.toNumber() : Number(amount);

	const formatted = new Intl.NumberFormat("en-ZA", {
		style: showSymbol ? "currency" : "decimal",
		currency,
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(numericAmount);

	return formatted;
}

// Date formatting
export function formatDate(date: Date | string, formatStr: string = "dd MMM yyyy"): string {
	const dateObj = typeof date === "string" ? parseISO(date) : date;
	return format(dateObj, formatStr);
}

export function formatDateTime(
	date: Date | string,
	formatStr: string = "dd MMM yyyy HH:mm"
): string {
	const dateObj = typeof date === "string" ? parseISO(date) : date;
	return format(dateObj, formatStr);
}

export function formatRelativeTime(date: Date | string): string {
	const dateObj = typeof date === "string" ? parseISO(date) : date;
	return formatDistanceToNow(dateObj, { addSuffix: true });
}

// Number formatting
export function formatNumber(
	value: number | string,
	options: { decimals?: number; locale?: string } = {}
): string {
	const { decimals = 0, locale = "en-ZA" } = options;
	const numericValue = Number(value);

	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(numericValue);
}

// Percentage formatting
export function formatPercentage(
	value: number | string,
	options: { decimals?: number } = {}
): string {
	const { decimals = 1 } = options;
	const numericValue = Number(value);

	return `${numericValue.toFixed(decimals)}%`;
}

// Phone number formatting (South African)
export function formatPhoneNumber(phone: string): string {
	// Remove all non-digits
	const digits = phone.replace(/\D/g, "");

	// Handle South African numbers
	if (digits.startsWith("27")) {
		// International format: +27 XX XXX XXXX
		return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
	}
	if (digits.startsWith("0") && digits.length === 10) {
		// Local format: 0XX XXX XXXX
		return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
	}

	return phone;
}

// Bank account number masking
export function maskAccountNumber(accountNumber: string): string {
	if (accountNumber.length <= 4) return accountNumber;
	const lastFour = accountNumber.slice(-4);
	const masked = "*".repeat(accountNumber.length - 4);
	return `${masked}${lastFour}`;
}

// ID number masking (South African)
export function maskIdNumber(idNumber: string): string {
	if (idNumber.length !== 13) return idNumber;
	return `${idNumber.slice(0, 6)}*****${idNumber.slice(-2)}`;
}

// Invoice number formatting
export function formatInvoiceNumber(prefix: string, number: number): string {
	return `${prefix}-${String(number).padStart(5, "0")}`;
}

// File size formatting
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
