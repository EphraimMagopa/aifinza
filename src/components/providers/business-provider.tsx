"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface Business {
	id: string;
	name: string;
	tradingName: string | null;
	logoUrl: string | null;
	businessType: string;
	industry: string | null;
	registrationNumber: string | null;
	taxNumber: string | null;
	vatNumber: string | null;
	isVatRegistered: boolean;
	vatCycle: string | null;
	financialYearEnd: number;
	email: string | null;
	phone: string | null;
	website: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	province: string | null;
	postalCode: string | null;
}

interface BusinessContextValue {
	businessId: string | null;
	business: Business | null;
	businesses: Array<Business & { role: string }>;
	role: string | null;
	isLoading: boolean;
	setBusinessId: (id: string) => void;
	hasPermission: (requiredRoles: string[]) => boolean;
	refreshBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

const BUSINESS_ID_KEY = "aifinza_business_id";

export function BusinessProvider({ children }: { children: React.ReactNode }) {
	const [businessId, setBusinessIdState] = useState<string | null>(null);
	const [businesses, setBusinesses] = useState<Array<Business & { role: string }>>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchBusinesses = useCallback(async () => {
		try {
			const response = await fetch("/api/businesses");
			if (response.ok) {
				const data = await response.json();
				setBusinesses(data.businesses || []);
				return data.businesses || [];
			}
		} catch (error) {
			console.error("Failed to fetch businesses:", error);
		}
		return [];
	}, []);

	const refreshBusinesses = useCallback(async () => {
		await fetchBusinesses();
	}, [fetchBusinesses]);

	useEffect(() => {
		const init = async () => {
			setIsLoading(true);
			const fetchedBusinesses = await fetchBusinesses();

			// Try to restore selected business from localStorage
			const storedId = localStorage.getItem(BUSINESS_ID_KEY);
			if (storedId && fetchedBusinesses.some((b: Business) => b.id === storedId)) {
				setBusinessIdState(storedId);
			} else if (fetchedBusinesses.length > 0) {
				// Default to first business
				setBusinessIdState(fetchedBusinesses[0].id);
				localStorage.setItem(BUSINESS_ID_KEY, fetchedBusinesses[0].id);
			}

			setIsLoading(false);
		};

		init();
	}, [fetchBusinesses]);

	const setBusinessId = useCallback((id: string) => {
		setBusinessIdState(id);
		localStorage.setItem(BUSINESS_ID_KEY, id);
	}, []);

	const currentBusiness = businesses.find((b) => b.id === businessId) || null;
	const role = currentBusiness?.role || null;

	const hasPermission = useCallback(
		(requiredRoles: string[]) => {
			if (!role) return false;
			return requiredRoles.includes(role);
		},
		[role]
	);

	return (
		<BusinessContext.Provider
			value={{
				businessId,
				business: currentBusiness,
				businesses,
				role,
				isLoading,
				setBusinessId,
				hasPermission,
				refreshBusinesses,
			}}
		>
			{children}
		</BusinessContext.Provider>
	);
}

export function useBusinessContext() {
	const context = useContext(BusinessContext);
	if (context === undefined) {
		throw new Error("useBusinessContext must be used within a BusinessProvider");
	}
	return context;
}
