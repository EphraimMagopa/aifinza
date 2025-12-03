type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
	requestId?: string;
	userId?: string;
	businessId?: string;
	[key: string]: unknown;
}

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: LogContext;
	error?: {
		name: string;
		message: string;
		stack?: string;
	};
}

/**
 * Determine if we should output structured JSON logs
 * In production, output JSON for log aggregation services
 * In development, output human-readable format
 */
const isProduction = process.env.NODE_ENV === "production";

/**
 * Get the current log level from environment
 */
function getMinLogLevel(): LogLevel {
	const level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
	if (["debug", "info", "warn", "error"].includes(level)) {
		return level;
	}
	return isProduction ? "info" : "debug";
}

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const minLevel = getMinLogLevel();

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
	return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

/**
 * Format a log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
	if (isProduction) {
		// Structured JSON for production
		return JSON.stringify(entry);
	}

	// Human-readable for development
	const levelColors: Record<LogLevel, string> = {
		debug: "\x1b[90m", // gray
		info: "\x1b[36m", // cyan
		warn: "\x1b[33m", // yellow
		error: "\x1b[31m", // red
	};
	const reset = "\x1b[0m";
	const color = levelColors[entry.level];

	let output = `${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`;

	if (entry.context && Object.keys(entry.context).length > 0) {
		output += ` ${JSON.stringify(entry.context)}`;
	}

	if (entry.error) {
		output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
		if (entry.error.stack) {
			output += `\n  ${entry.error.stack}`;
		}
	}

	return output;
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
	if (!shouldLog(level)) {
		return;
	}

	const entry: LogEntry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		context,
	};

	if (error) {
		entry.error = {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
	}

	const formatted = formatLogEntry(entry);

	switch (level) {
		case "debug":
			console.debug(formatted);
			break;
		case "info":
			console.info(formatted);
			break;
		case "warn":
			console.warn(formatted);
			break;
		case "error":
			console.error(formatted);
			break;
	}
}

/**
 * Structured logger for the application
 *
 * @example
 * // Basic usage
 * logger.info("User logged in", { userId: "123" });
 *
 * // With error
 * logger.error("Failed to process payment", { orderId: "456" }, error);
 *
 * // Child logger with preset context
 * const requestLogger = logger.child({ requestId: "abc-123" });
 * requestLogger.info("Processing request");
 */
export const logger = {
	debug: (message: string, context?: LogContext) => log("debug", message, context),
	info: (message: string, context?: LogContext) => log("info", message, context),
	warn: (message: string, context?: LogContext) => log("warn", message, context),
	error: (message: string, context?: LogContext, error?: Error) =>
		log("error", message, context, error),

	/**
	 * Create a child logger with preset context
	 * Useful for request-scoped logging
	 */
	child: (baseContext: LogContext) => ({
		debug: (message: string, context?: LogContext) =>
			log("debug", message, { ...baseContext, ...context }),
		info: (message: string, context?: LogContext) =>
			log("info", message, { ...baseContext, ...context }),
		warn: (message: string, context?: LogContext) =>
			log("warn", message, { ...baseContext, ...context }),
		error: (message: string, context?: LogContext, error?: Error) =>
			log("error", message, { ...baseContext, ...context }, error),
	}),
};

/**
 * Create a request-scoped logger with automatic request ID
 */
export function createRequestLogger(requestId: string, userId?: string, businessId?: string) {
	return logger.child({
		requestId,
		userId,
		businessId,
	});
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
	return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
