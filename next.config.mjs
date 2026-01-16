/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    unoptimized: true
  },
  devIndicators: false,
  // Exclude better-sqlite3 from webpack bundling on Vercel
  webpack: (config, { isServer }) => {
    if (isServer && process.env.VERCEL) {
      config.externals = config.externals || []
      config.externals.push('better-sqlite3')
    }
    return config
  },
  // Ignore better-sqlite3 type checking errors on Vercel
  typescript: {
    ignoreBuildErrors: process.env.VERCEL === '1'
  }
}

export default nextConfig
