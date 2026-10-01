// Plain .mjs rather than .ts on purpose: loading a TypeScript config requires
// the `typescript` package at build time, which is a dev dependency and so is
// the first thing to disappear when a deploy installs with production=true.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      // Belt and braces with the robots metadata: no audit should ever be indexed.
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // Logos are fetched once at build time and never change between deploys.
      { source: "/logos/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
