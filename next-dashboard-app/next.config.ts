import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "picsum.photos",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "storage.googleapis.com", // common for Gemini image outputs
			},
			{
				protocol: "https",
				hostname: "**.googleusercontent.com", // fallback for signed Google URLs
			},
		],
	},
};

export default nextConfig;
