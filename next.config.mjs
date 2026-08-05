/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // TODO(P6): tighten this allowlist before public launch — currently accepts
    // any HTTPS host, which is OK for P0 (no media yet) but permissive for prod.
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  },
  // Keep jsdom (transitive of isomorphic-dompurify) as a real Node module so
  // its `path.resolve(__dirname, ...)` calls still find the package files at
  // runtime. Bundling it via webpack breaks because `__dirname` no longer
  // points at the package directory.
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  }
};

export default nextConfig;
