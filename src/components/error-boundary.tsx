"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { captureException } from "@/lib/error-tracking";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * React Error Boundary component
 * Catches JavaScript errors in child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log to error tracking service
		captureException(error, {
			extra: {
				componentStack: errorInfo.componentStack,
			},
		});

		// Also log to console in development
		if (process.env.NODE_ENV === "development") {
			console.error("ErrorBoundary caught an error:", error, errorInfo);
		}
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="min-h-screen flex items-center justify-center p-4">
					<Card className="max-w-md w-full">
						<CardHeader>
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-destructive" />
								<CardTitle>Something went wrong</CardTitle>
							</div>
							<CardDescription>
								An unexpected error occurred. Our team has been notified.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{process.env.NODE_ENV === "development" && this.state.error && (
								<div className="bg-muted rounded-lg p-4 overflow-auto max-h-48">
									<p className="text-sm font-mono text-destructive">{this.state.error.message}</p>
								</div>
							)}
						</CardContent>
						<CardFooter className="flex gap-2">
							<Button onClick={this.handleReset} variant="outline">
								<RefreshCw className="h-4 w-4 mr-2" />
								Try Again
							</Button>
							<Button onClick={() => window.location.assign("/")} variant="default">
								Go Home
							</Button>
						</CardFooter>
					</Card>
				</div>
			);
		}

		return this.props.children;
	}
}

/**
 * Functional wrapper for ErrorBoundary with hooks support
 */
export function withErrorBoundary<P extends object>(
	WrappedComponent: React.ComponentType<P>,
	fallback?: ReactNode
) {
	return function WithErrorBoundary(props: P) {
		return (
			<ErrorBoundary fallback={fallback}>
				<WrappedComponent {...props} />
			</ErrorBoundary>
		);
	};
}
