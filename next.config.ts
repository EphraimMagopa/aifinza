import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Enable standalone output for Docker deployment
	output: "standalone",

	// Enable React Compiler for automatic memoization
	reactCompiler: true,

	// Enable Cache Components for opt-in caching (moved from experimental in Next.js 16)
	cacheComponents: true,

	experimental: {
		// Faster dev startup with Turbopack filesystem caching
		turbopackFileSystemCacheForDev: true,
	},

	// TypeScript settings
	typescript: {
		ignoreBuildErrors: false,
	},

	// Image optimization
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
};

export default nextConfig;
