"use client";

import { useBusinessContext } from "@/components/providers/business-provider";

export function useBusiness() {
	return useBusinessContext();
}

export function useBusinessId() {
	const { businessId } = useBusinessContext();
	return businessId;
}

export function useBusinessRole() {
	const { role, hasPermission } = useBusinessContext();
	return { role, hasPermission };
}
