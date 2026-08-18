import type { NextConfig } from "next";

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/api\/v1$/, "") ?? "https://api.dollar2x.trade/";
//const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/api\/v1$/, "") ?? "http://localhost:3000";

const nextConfig: NextConfig = {
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
