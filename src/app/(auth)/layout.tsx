import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 dark:from-slate-900 dark:to-slate-800">
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
						Aifinza
					</h1>
					<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
						Financial management for South African SMBs
					</p>
				</div>
				{children}
			</div>
		</div>
	);
}
