"use client";

import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import type { CalendarEvent, CalendarEventInput } from "@/types/calendar";
import { useBusiness } from "./use-business";

export function useCalendar() {
	const { businessId } = useBusiness();
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentDate, setCurrentDate] = useState(new Date());

	const fetchEvents = useCallback(
		async (start: Date, end: Date) => {
			if (!businessId) return;

			setIsLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams({
					startDate: start.toISOString(),
					endDate: end.toISOString(),
				});

				const response = await fetch(`/api/businesses/${businessId}/calendar?${params}`);

				if (response.ok) {
					const data = await response.json();
					setEvents(data.events);
				} else {
					setError("Failed to load events");
				}
			} catch (err) {
				console.error("Failed to fetch events:", err);
				setError("Failed to load events");
			} finally {
				setIsLoading(false);
			}
		},
		[businessId]
	);

	// Fetch events for current month (with buffer for previous/next month days)
	useEffect(() => {
		const start = startOfMonth(subMonths(currentDate, 1));
		const end = endOfMonth(addMonths(currentDate, 1));
		fetchEvents(start, end);
	}, [currentDate, fetchEvents]);

	const nextMonth = useCallback(() => {
		setCurrentDate((prev) => addMonths(prev, 1));
	}, []);

	const prevMonth = useCallback(() => {
		setCurrentDate((prev) => subMonths(prev, 1));
	}, []);

	const goToToday = useCallback(() => {
		setCurrentDate(new Date());
	}, []);

	const goToDate = useCallback((date: Date) => {
		setCurrentDate(date);
	}, []);

	const createEvent = useCallback(
		async (input: CalendarEventInput): Promise<CalendarEvent | null> => {
			if (!businessId) return null;

			try {
				const response = await fetch(`/api/businesses/${businessId}/calendar`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				});

				if (response.ok) {
					const data = await response.json();
					setEvents((prev) =>
						[...prev, data.event].sort(
							(a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
						)
					);
					return data.event;
				}
			} catch (err) {
				console.error("Failed to create event:", err);
			}
			return null;
		},
		[businessId]
	);

	const updateEvent = useCallback(
		async (
			eventId: string,
			input: Partial<CalendarEventInput> & { completed?: boolean }
		): Promise<CalendarEvent | null> => {
			if (!businessId) return null;

			try {
				const response = await fetch(`/api/businesses/${businessId}/calendar/${eventId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				});

				if (response.ok) {
					const data = await response.json();
					setEvents((prev) => prev.map((e) => (e.id === eventId ? data.event : e)));
					return data.event;
				}
			} catch (err) {
				console.error("Failed to update event:", err);
			}
			return null;
		},
		[businessId]
	);

	const deleteEvent = useCallback(
		async (eventId: string): Promise<boolean> => {
			if (!businessId) return false;

			try {
				const response = await fetch(`/api/businesses/${businessId}/calendar/${eventId}`, {
					method: "DELETE",
				});

				if (response.ok) {
					setEvents((prev) => prev.filter((e) => e.id !== eventId));
					return true;
				}
			} catch (err) {
				console.error("Failed to delete event:", err);
			}
			return false;
		},
		[businessId]
	);

	const getEventsForDate = useCallback(
		(date: Date) => {
			const dateStr = format(date, "yyyy-MM-dd");
			return events.filter((event) => {
				const eventDate = format(new Date(event.startDate), "yyyy-MM-dd");
				return eventDate === dateStr;
			});
		},
		[events]
	);

	return {
		events,
		isLoading,
		error,
		currentDate,
		nextMonth,
		prevMonth,
		goToToday,
		goToDate,
		createEvent,
		updateEvent,
		deleteEvent,
		getEventsForDate,
		refresh: () => {
			const start = startOfMonth(subMonths(currentDate, 1));
			const end = endOfMonth(addMonths(currentDate, 1));
			fetchEvents(start, end);
		},
	};
}
