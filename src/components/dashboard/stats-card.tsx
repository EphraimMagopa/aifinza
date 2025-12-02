"use client";

import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardProps {
	title: string;
	value: string | number;
	description?: string;
	icon?: LucideIcon;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	className?: string;
}

export function StatsCard({
	title,
	value,
	description,
	icon: Icon,
	trend,
	className,
}: StatsCardProps) {
	return (
		<Card className={cn(className)}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{(description || trend) && (
					<p className="text-xs text-muted-foreground">
						{trend && (
							<span
								className={cn("font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}
							>
								{trend.isPositive ? "+" : ""}
								{trend.value}%
							</span>
						)}
						{trend && description && " "}
						{description}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

export function StatsCardSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-4" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-8 w-32 mb-1" />
				<Skeleton className="h-3 w-40" />
			</CardContent>
		</Card>
	);
}
