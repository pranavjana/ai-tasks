/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: './dist', // Changes the build output directory to `./dist/`
  images: {
    unoptimized: true, // Required for static export
  },
  // We'll handle API proxying differently since rewrites don't work with static export
  eslint: {
    // Disable ESLint during production builds for now
    ignoreDuringBuilds: true,
  },
  // Add experimental features for Tailwind CSS v4.0
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig; 
