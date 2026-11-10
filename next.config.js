/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'f.wishabi.net' },
      { protocol: 'https', hostname: '**' }
    ]
  },
  async redirects() {
    return [
      { source: '/smart-deals', destination: '/deals', permanent: true },
      { source: '/good-deals', destination: '/deals', permanent: true },
      { source: '/price-reporting', destination: '/report', permanent: true },
      { source: '/sponsor', destination: '/advertise', permanent: true },
      { source: '/support', destination: '/donate', permanent: true },
      { source: '/subscribe', destination: '/newsletter', permanent: true },
      { source: '/giveaway', destination: '/contests', permanent: true }
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};
module.exports = nextConfig;
