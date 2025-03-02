/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: './dist', // Changes the build output directory to `./dist/`
  
  // Image optimization
  images: {
    domains: ['ihiuqrjobgyjujyboqnv.supabase.co'], // Add your Supabase domain for image optimization
    formats: ['image/avif', 'image/webp'],
  },
  
  // Improve performance with compression
  compress: true,
  
  // Improve performance with HTTP/2 server push
  poweredByHeader: false,
  
  // Improve performance with response headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Disable ESLint during production builds for now
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Add experimental features for Tailwind CSS v4.0
  experimental: {
    optimizeCss: true,
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  
  // External packages that should be treated as server components
  serverExternalPackages: ['@supabase/supabase-js'],
};

export default nextConfig; 
