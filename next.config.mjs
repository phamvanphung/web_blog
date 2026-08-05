/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // TODO(P6): tighten this allowlist before public launch — currently accepts
    // any HTTPS host, which is OK for P0 (no media yet) but permissive for prod.
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  }
};

export default nextConfig;
