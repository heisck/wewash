import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin Turbopack root to this app so a parent package-lock.json
  // (e.g. C:\Users\comp\package-lock.json) is not treated as the workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
