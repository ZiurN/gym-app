import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // The screens used to have Spanish addresses; keep old links and installed
  // copies of the app working.
  async redirects() {
    return [
      { from: "entrenar", to: "train" },
      { from: "progreso", to: "progress" },
      { from: "cuenta", to: "account" },
    ].flatMap(({ from, to }) => [
      { source: `/${from}`, destination: `/${to}`, permanent: true },
      { source: `/${from}/:path*`, destination: `/${to}/:path*`, permanent: true },
    ]);
  },
};

export default nextConfig;
