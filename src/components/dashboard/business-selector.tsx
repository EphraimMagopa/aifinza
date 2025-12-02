"use client";

import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBusiness } from "@/hooks/use-business";
import { cn } from "@/lib/utils";

export function BusinessSelector() {
	const router = useRouter();
	const { business, businesses, setBusinessId, isLoading } = useBusiness();
	const [open, setOpen] = useState(false);

	if (isLoading) {
		return (
			<Button variant="outline" className="w-[200px] justify-between" disabled>
				<span className="truncate">Loading...</span>
			</Button>
		);
	}

	if (businesses.length === 0) {
		return (
			<Button variant="outline" onClick={() => router.push("/onboarding")}>
				<Plus className="mr-2 h-4 w-4" />
				Create Business
			</Button>
		);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" aria-expanded={open} className="w-[200px] justify-between">
					<div className="flex items-center gap-2 truncate">
						<Building2 className="h-4 w-4 shrink-0" />
						<span className="truncate">
							{business?.tradingName || business?.name || "Select business"}
						</span>
					</div>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search business..." />
					<CommandList>
						<CommandEmpty>No business found.</CommandEmpty>
						<CommandGroup>
							{businesses.map((b) => (
								<CommandItem
									key={b.id}
									value={b.name}
									onSelect={() => {
										setBusinessId(b.id);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											business?.id === b.id ? "opacity-100" : "opacity-0"
										)}
									/>
									<span className="truncate">{b.tradingName || b.name}</span>
								</CommandItem>
							))}
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup>
							<CommandItem
								onSelect={() => {
									setOpen(false);
									router.push("/onboarding");
								}}
							>
								<Plus className="mr-2 h-4 w-4" />
								Create new business
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
