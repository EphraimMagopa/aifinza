"use client";

import {
	addDays,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	isToday,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import {
	Calendar as CalendarIcon,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	Plus,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/hooks/use-business";
import { useCalendar } from "@/hooks/use-calendar";
import { cn } from "@/lib/utils";
import { eventTypeOptions } from "@/lib/validations/calendar";
import type { CalendarEvent, CalendarEventInput, EventType } from "@/types/calendar";
import { EVENT_TYPE_COLORS } from "@/types/calendar";

export default function CalendarPage() {
	const { businessId } = useBusiness();
	const {
		events,
		isLoading,
		currentDate,
		nextMonth,
		prevMonth,
		goToToday,
		createEvent,
		updateEvent,
		deleteEvent,
		getEventsForDate,
	} = useCalendar();

	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState<CalendarEventInput>({
		title: "",
		description: "",
		type: "CUSTOM",
		startDate: new Date().toISOString(),
		allDay: false,
	});

	// Generate calendar days
	const monthStart = startOfMonth(currentDate);
	const monthEnd = endOfMonth(currentDate);
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

	const days: Date[] = [];
	let day = calendarStart;
	while (day <= calendarEnd) {
		days.push(day);
		day = addDays(day, 1);
	}

	const weeks: Date[][] = [];
	for (let i = 0; i < days.length; i += 7) {
		weeks.push(days.slice(i, i + 7));
	}

	const handleDateClick = (date: Date) => {
		setSelectedDate(date);
		setSelectedEvent(null);
		setFormData({
			title: "",
			description: "",
			type: "CUSTOM",
			startDate: date.toISOString(),
			allDay: true,
		});
		setIsDialogOpen(true);
	};

	const handleEventClick = (event: CalendarEvent) => {
		setSelectedEvent(event);
		setSelectedDate(new Date(event.startDate));
		setFormData({
			title: event.title,
			description: event.description || "",
			type: event.type,
			startDate: event.startDate,
			endDate: event.endDate || undefined,
			allDay: event.allDay,
		});
		setIsDialogOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (selectedEvent) {
				await updateEvent(selectedEvent.id, formData);
			} else {
				await createEvent(formData);
			}
			setIsDialogOpen(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedEvent) return;
		setIsSubmitting(true);
		try {
			await deleteEvent(selectedEvent.id);
			setIsDialogOpen(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleToggleComplete = async (event: CalendarEvent) => {
		await updateEvent(event.id, { completed: !event.completed });
	};

	if (!businessId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Please select a business first.</p>
			</div>
		);
	}

	if (isLoading && events.length === 0) {
		return <CalendarSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
					<p className="text-muted-foreground">
						View and manage your events, deadlines, and reminders
					</p>
				</div>
				<Button onClick={() => handleDateClick(new Date())}>
					<Plus className="mr-2 h-4 w-4" />
					New Event
				</Button>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<CardTitle className="flex items-center gap-2">
						<CalendarIcon className="h-5 w-5" />
						{format(currentDate, "MMMM yyyy")}
					</CardTitle>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={goToToday}>
							Today
						</Button>
						<Button variant="outline" size="icon" onClick={prevMonth}>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="icon" onClick={nextMonth}>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{/* Day headers */}
					<div className="grid grid-cols-7 gap-px bg-muted rounded-t-lg overflow-hidden">
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
							<div
								key={dayName}
								className="bg-background p-2 text-center text-sm font-medium text-muted-foreground"
							>
								{dayName}
							</div>
						))}
					</div>

					{/* Calendar grid */}
					<div className="grid grid-cols-7 gap-px bg-muted">
						{weeks.map((week, _weekIndex) =>
							week.map((date) => {
								const dayEvents = getEventsForDate(date);
								const isCurrentMonth = isSameMonth(date, currentDate);
								const isSelected = selectedDate && isSameDay(date, selectedDate);

								return (
									// biome-ignore lint/a11y/useSemanticElements: Complex calendar cell with nested content
									<div
										key={date.toISOString()}
										role="button"
										tabIndex={0}
										className={cn(
											"bg-background min-h-[100px] p-1 cursor-pointer hover:bg-muted/50 transition-colors",
											!isCurrentMonth && "text-muted-foreground/50 bg-muted/30",
											isSelected && "ring-2 ring-primary ring-inset"
										)}
										onClick={() => handleDateClick(date)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												handleDateClick(date);
											}
										}}
									>
										<div
											className={cn(
												"flex h-7 w-7 items-center justify-center rounded-full text-sm",
												isToday(date) && "bg-primary text-primary-foreground font-bold"
											)}
										>
											{format(date, "d")}
										</div>
										<div className="space-y-0.5 mt-1">
											{dayEvents.slice(0, 3).map((event) => (
												<button
													key={event.id}
													type="button"
													className={cn(
														"w-full text-left text-xs px-1 py-0.5 rounded truncate",
														EVENT_TYPE_COLORS[event.type],
														"text-white",
														event.completed && "opacity-50 line-through"
													)}
													onClick={(e) => {
														e.stopPropagation();
														handleEventClick(event);
													}}
												>
													{event.title}
												</button>
											))}
											{dayEvents.length > 3 && (
												<p className="text-xs text-muted-foreground px-1">
													+{dayEvents.length - 3} more
												</p>
											)}
										</div>
									</div>
								);
							})
						)}
					</div>
				</CardContent>
			</Card>

			{/* Upcoming Events */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Upcoming Events
					</CardTitle>
				</CardHeader>
				<CardContent>
					{events.filter((e) => new Date(e.startDate) >= new Date()).length === 0 ? (
						<p className="text-sm text-muted-foreground">No upcoming events</p>
					) : (
						<div className="space-y-3">
							{events
								.filter((e) => new Date(e.startDate) >= new Date())
								.slice(0, 5)
								.map((event) => (
									// biome-ignore lint/a11y/useSemanticElements: Event list item with nested button
									<div
										key={event.id}
										role="button"
										tabIndex={0}
										className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
										onClick={() => handleEventClick(event)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												handleEventClick(event);
											}
										}}
									>
										<div className={cn("w-3 h-3 rounded-full", EVENT_TYPE_COLORS[event.type])} />
										<div className="flex-1 min-w-0">
											<p
												className={cn(
													"text-sm font-medium truncate",
													event.completed && "line-through text-muted-foreground"
												)}
											>
												{event.title}
											</p>
											<p className="text-xs text-muted-foreground">
												{format(new Date(event.startDate), "MMM d, yyyy")}
												{!event.allDay && ` at ${format(new Date(event.startDate), "h:mm a")}`}
											</p>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="shrink-0"
											onClick={(e) => {
												e.stopPropagation();
												handleToggleComplete(event);
											}}
										>
											<CheckCircle2
												className={cn(
													"h-4 w-4",
													event.completed ? "text-green-500" : "text-muted-foreground"
												)}
											/>
										</Button>
									</div>
								))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Event Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{selectedEvent ? "Edit Event" : "New Event"}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
								placeholder="Event title"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="type">Type</Label>
							<Select
								value={formData.type}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, type: value as EventType }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{eventTypeOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="startDate">Date</Label>
							<Input
								id="startDate"
								type={formData.allDay ? "date" : "datetime-local"}
								value={
									formData.allDay
										? format(new Date(formData.startDate), "yyyy-MM-dd")
										: format(new Date(formData.startDate), "yyyy-MM-dd'T'HH:mm")
								}
								onChange={(e) => {
									const date = new Date(e.target.value);
									setFormData((prev) => ({
										...prev,
										startDate: date.toISOString(),
									}));
								}}
								required
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Switch
								id="allDay"
								checked={formData.allDay}
								onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, allDay: checked }))}
							/>
							<Label htmlFor="allDay">All day event</Label>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description (optional)</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								placeholder="Add description..."
								rows={3}
							/>
						</div>

						<div className="flex justify-between pt-4">
							{selectedEvent && (
								<Button
									type="button"
									variant="destructive"
									onClick={handleDelete}
									disabled={isSubmitting}
								>
									Delete
								</Button>
							)}
							<div className="flex gap-2 ml-auto">
								<Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? "Saving..." : selectedEvent ? "Update" : "Create"}
								</Button>
							</div>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function CalendarSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-10 w-28" />
			</div>
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-7 gap-px">
						{Array.from({ length: 35 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
							<Skeleton key={`cal-${i}`} className="h-24" />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
