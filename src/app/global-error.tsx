"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { captureException } from "@/lib/error-tracking";

/**
 * Global error handler for Next.js App Router
 * This catches errors in the root layout and provides a fallback UI
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to error tracking service
		captureException(error, {
			tags: {
				errorType: "global",
				digest: error.digest || "unknown",
			},
		});
	}, [error]);

	return (
		<html lang="en">
			<body>
				<div className="min-h-screen flex items-center justify-center p-4 bg-background">
					<Card className="max-w-md w-full">
						<CardHeader>
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-destructive" />
								<CardTitle>Application Error</CardTitle>
							</div>
							<CardDescription>
								A critical error occurred. Our team has been notified and is working on a fix.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="bg-muted rounded-lg p-4">
								<p className="text-sm text-muted-foreground">
									Error ID: <code className="font-mono">{error.digest || "N/A"}</code>
								</p>
							</div>
						</CardContent>
						<CardFooter className="flex gap-2">
							<Button onClick={reset} variant="outline">
								<RefreshCw className="h-4 w-4 mr-2" />
								Try Again
							</Button>
							<Button onClick={() => window.location.assign("/")} variant="default">
								Go Home
							</Button>
						</CardFooter>
					</Card>
				</div>
			</body>
		</html>
	);
}
