import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "ZAR", locale = "en-ZA"): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("en-ZA", {
		day: "numeric",
		month: "short",
		year: "numeric",
		...options,
	}).format(d);
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
	return new Intl.NumberFormat("en-ZA", options).format(value);
}
