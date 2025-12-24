/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  // Electron-specific configuration
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // Disable static optimization for dynamic features
  experimental: {
    // This ensures all pages are statically exported
  },
  // Asset prefix for Electron (served from file:// protocol)
  assetPrefix: './',
}

module.exports = nextConfig