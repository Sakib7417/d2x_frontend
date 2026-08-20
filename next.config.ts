import type { NextConfig } from "next";

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/api\/v1$/, "") ?? "https://api.dollar2x.trade/";
// const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/api\/v1$/, "") ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  generateEtags: false,
  // Prevent browsers and upstream CDNs from caching HTML/API responses.
  // _next/static chunks remain immutable and long-cached because their names are hashed.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  // Proxy uploaded images through the Next server so the browser never needs
  // to know the backend's origin. /uploads/posts/xxx.jpg -> backend:3000/uploads/posts/xxx.jpg
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${API_BASE_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
