export type EventType =
	| "TAX_DEADLINE"
	| "INVOICE_DUE"
	| "PAYMENT_DUE"
	| "MEETING"
	| "REMINDER"
	| "PAYROLL"
	| "CUSTOM";

export interface CalendarEvent {
	id: string;
	businessId: string;
	userId: string;
	title: string;
	description?: string | null;
	type: EventType;
	startDate: string;
	endDate?: string | null;
	allDay: boolean;
	isRecurring: boolean;
	recurrenceRule?: string | null;
	reminderMinutes: number[];
	relatedId?: string | null;
	relatedType?: string | null;
	completed: boolean;
	completedAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CalendarEventInput {
	title: string;
	description?: string;
	type: EventType;
	startDate: string;
	endDate?: string;
	allDay?: boolean;
	isRecurring?: boolean;
	recurrenceRule?: string;
	reminderMinutes?: number[];
	relatedId?: string;
	relatedType?: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
	TAX_DEADLINE: "Tax Deadline",
	INVOICE_DUE: "Invoice Due",
	PAYMENT_DUE: "Payment Due",
	MEETING: "Meeting",
	REMINDER: "Reminder",
	PAYROLL: "Payroll",
	CUSTOM: "Custom",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
	TAX_DEADLINE: "bg-red-500",
	INVOICE_DUE: "bg-orange-500",
	PAYMENT_DUE: "bg-yellow-500",
	MEETING: "bg-blue-500",
	REMINDER: "bg-purple-500",
	PAYROLL: "bg-green-500",
	CUSTOM: "bg-gray-500",
};
