import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Create Redis client singleton
const createRedisClient = () => {
	const client = new Redis(redisUrl, {
		maxRetriesPerRequest: 3,
		retryStrategy: (times) => {
			if (times > 3) {
				console.error("Redis: Max retries reached");
				return null;
			}
			return Math.min(times * 100, 3000);
		},
		reconnectOnError: (err) => {
			console.error("Redis reconnect error:", err.message);
			return true;
		},
	});

	client.on("error", (err) => {
		console.error("Redis client error:", err);
	});

	client.on("connect", () => {
		console.log("Redis: Connected");
	});

	return client;
};

const globalForRedis = globalThis as unknown as {
	redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
	globalForRedis.redis = redis;
}

export default redis;
