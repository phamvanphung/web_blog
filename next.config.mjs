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
    serverActions: { bodySizeLimit: '10mb' },
    // Force single-threaded `next build`. Next.js build uses worker
    // threads for parallel page rendering by default (≈ cpu count - 1
    // workers). Each worker is a separate V8 isolate with its own
    // globalThis, so each creates an independent mariadb pool — with N
    // workers × 20-conn pool = 100+ simultaneous connections during a
    // 6-route build. MySQL's `caching_sha2_password` handshake is slow
    // (≈ 200-500ms per conn), the mariadb driver's acquireTimeout (30s)
    // fires, and the build fails with `active=0 idle=0 limit=20`.
    //
    // Trade-off: build takes 60-90s instead of 48s. Acceptable for a
    // small app; we trade build speed for build reliability and a
    // predictable pool footprint that matches `next start`.
    //
    // `cpus: 1` is the durable fix (still respected on Node 20+). The
    // `workerThreads: false` flag is the older escape hatch kept as a
    // belt-and-suspenders signal in case Next changes the cpus semantics.
    cpus: 1,
    workerThreads: false
  }
};

export default nextConfig;
