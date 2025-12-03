/**
 * South African Payroll Tax Calculations (2024/2025 Tax Year)
 * Based on SARS tax tables
 */

// PAYE Tax Brackets (2024/2025)
const PAYE_TAX_BRACKETS = [
	{ min: 0, max: 237100, rate: 0.18, baseTax: 0 },
	{ min: 237101, max: 370500, rate: 0.26, baseTax: 42678 },
	{ min: 370501, max: 512800, rate: 0.31, baseTax: 77362 },
	{ min: 512801, max: 673000, rate: 0.36, baseTax: 121475 },
	{ min: 673001, max: 857900, rate: 0.39, baseTax: 179147 },
	{ min: 857901, max: 1817000, rate: 0.41, baseTax: 251258 },
	{ min: 1817001, max: Number.POSITIVE_INFINITY, rate: 0.45, baseTax: 644489 },
] as const;

// Tax Rebates (2024/2025)
const TAX_REBATES = {
	primary: 17235, // All taxpayers
	secondary: 9444, // 65 and older
	tertiary: 3145, // 75 and older
} as const;

// Tax Thresholds (2024/2025)
const TAX_THRESHOLDS = {
	under65: 95750,
	aged65to74: 148217,
	aged75plus: 165689,
} as const;

// UIF Rate (1% employee, 1% employer, capped at R17,712/month earnings)
const UIF_RATE = 0.01;
const UIF_MONTHLY_CAP = 17712;

// SDL Rate (1% of payroll, employer only)
const SDL_RATE = 0.01;

export interface PayrollCalculationInput {
	annualGrossSalary: number;
	ageAtEndOfTaxYear?: number;
	pensionContributionEmployee?: number;
	medicalAidContribution?: number;
	otherDeductions?: number;
	pensionContributionEmployer?: number;
}

export interface PayrollCalculationResult {
	// Monthly amounts
	monthlyGross: number;
	monthlyPaye: number;
	monthlyUifEmployee: number;
	monthlyPensionEmployee: number;
	monthlyMedicalAid: number;
	monthlyOtherDeductions: number;
	monthlyTotalDeductions: number;
	monthlyNetPay: number;

	// Employer contributions
	monthlyUifEmployer: number;
	monthlySdl: number;
	monthlyPensionEmployer: number;
	monthlyTotalEmployerCost: number;

	// Annual amounts
	annualGross: number;
	annualPaye: number;
	annualUifEmployee: number;
	annualNetPay: number;
}

/**
 * Calculate PAYE (Pay As You Earn) income tax
 */
export function calculatePaye(annualTaxableIncome: number, ageAtEndOfTaxYear = 30): number {
	if (annualTaxableIncome <= 0) return 0;

	// Check tax threshold based on age
	const threshold =
		ageAtEndOfTaxYear >= 75
			? TAX_THRESHOLDS.aged75plus
			: ageAtEndOfTaxYear >= 65
				? TAX_THRESHOLDS.aged65to74
				: TAX_THRESHOLDS.under65;

	if (annualTaxableIncome <= threshold) return 0;

	// Find applicable tax bracket
	let tax = 0;
	for (const bracket of PAYE_TAX_BRACKETS) {
		if (annualTaxableIncome >= bracket.min && annualTaxableIncome <= bracket.max) {
			tax = bracket.baseTax + (annualTaxableIncome - bracket.min + 1) * bracket.rate;
			break;
		}
	}

	// Apply rebates based on age
	let rebate = TAX_REBATES.primary;
	if (ageAtEndOfTaxYear >= 65) rebate += TAX_REBATES.secondary;
	if (ageAtEndOfTaxYear >= 75) rebate += TAX_REBATES.tertiary;

	tax = Math.max(0, tax - rebate);

	return Math.round(tax * 100) / 100;
}

/**
 * Calculate UIF (Unemployment Insurance Fund) contribution
 */
export function calculateUif(monthlyGross: number): {
	employee: number;
	employer: number;
} {
	const cappedAmount = Math.min(monthlyGross, UIF_MONTHLY_CAP);
	const contribution = Math.round(cappedAmount * UIF_RATE * 100) / 100;

	return {
		employee: contribution,
		employer: contribution,
	};
}

/**
 * Calculate SDL (Skills Development Levy) - employer only
 */
export function calculateSdl(monthlyGross: number): number {
	return Math.round(monthlyGross * SDL_RATE * 100) / 100;
}

/**
 * Calculate complete payroll for an employee
 */
export function calculatePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
	const {
		annualGrossSalary,
		ageAtEndOfTaxYear = 30,
		pensionContributionEmployee = 0,
		medicalAidContribution = 0,
		otherDeductions = 0,
		pensionContributionEmployer = 0,
	} = input;

	// Monthly gross
	const monthlyGross = Math.round((annualGrossSalary / 12) * 100) / 100;

	// Calculate taxable income (after pension deduction, capped at 27.5% of gross or R350,000/year)
	const pensionDeductionCap = Math.min(
		pensionContributionEmployee * 12,
		annualGrossSalary * 0.275,
		350000
	);
	const annualTaxableIncome = annualGrossSalary - pensionDeductionCap;

	// Calculate PAYE
	const annualPaye = calculatePaye(annualTaxableIncome, ageAtEndOfTaxYear);
	const monthlyPaye = Math.round((annualPaye / 12) * 100) / 100;

	// Calculate UIF
	const uif = calculateUif(monthlyGross);
	const monthlyUifEmployee = uif.employee;
	const monthlyUifEmployer = uif.employer;

	// Calculate SDL
	const monthlySdl = calculateSdl(monthlyGross);

	// Monthly deductions
	const monthlyPensionEmployee = pensionContributionEmployee;
	const monthlyMedicalAid = medicalAidContribution;
	const monthlyOtherDeductions = otherDeductions;

	const monthlyTotalDeductions =
		monthlyPaye +
		monthlyUifEmployee +
		monthlyPensionEmployee +
		monthlyMedicalAid +
		monthlyOtherDeductions;

	const monthlyNetPay = Math.round((monthlyGross - monthlyTotalDeductions) * 100) / 100;

	// Employer contributions
	const monthlyPensionEmployer = pensionContributionEmployer;
	const monthlyTotalEmployerCost =
		monthlyGross + monthlyUifEmployer + monthlySdl + monthlyPensionEmployer;

	return {
		monthlyGross,
		monthlyPaye,
		monthlyUifEmployee,
		monthlyPensionEmployee,
		monthlyMedicalAid,
		monthlyOtherDeductions,
		monthlyTotalDeductions,
		monthlyNetPay,
		monthlyUifEmployer,
		monthlySdl,
		monthlyPensionEmployer,
		monthlyTotalEmployerCost: Math.round(monthlyTotalEmployerCost * 100) / 100,
		annualGross: annualGrossSalary,
		annualPaye,
		annualUifEmployee: Math.round(monthlyUifEmployee * 12 * 100) / 100,
		annualNetPay: Math.round(monthlyNetPay * 12 * 100) / 100,
	};
}

/**
 * Calculate payslip amounts from gross salary and deduction inputs
 */
export function calculatePayslipAmounts(input: {
	basicSalary: number;
	overtime?: number;
	bonus?: number;
	commission?: number;
	allowances?: number;
	pensionEmployee?: number;
	medicalAid?: number;
	otherDeductions?: number;
	pensionEmployer?: number;
}): {
	grossPay: number;
	paye: number;
	uif: number;
	totalDeductions: number;
	uifEmployer: number;
	sdl: number;
	netPay: number;
} {
	const grossPay =
		input.basicSalary +
		(input.overtime || 0) +
		(input.bonus || 0) +
		(input.commission || 0) +
		(input.allowances || 0);

	// Annualize for PAYE calculation (assuming monthly)
	const annualGross = grossPay * 12;
	const annualPaye = calculatePaye(annualGross - (input.pensionEmployee || 0) * 12);
	const paye = Math.round((annualPaye / 12) * 100) / 100;

	// UIF
	const uifCalc = calculateUif(grossPay);
	const uif = uifCalc.employee;
	const uifEmployer = uifCalc.employer;

	// SDL
	const sdl = calculateSdl(grossPay);

	// Total deductions
	const totalDeductions =
		paye +
		uif +
		(input.pensionEmployee || 0) +
		(input.medicalAid || 0) +
		(input.otherDeductions || 0);

	const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

	return {
		grossPay: Math.round(grossPay * 100) / 100,
		paye,
		uif,
		totalDeductions: Math.round(totalDeductions * 100) / 100,
		uifEmployer,
		sdl,
		netPay,
	};
}
