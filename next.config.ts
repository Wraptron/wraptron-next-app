// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   webpack: (config, { isServer, webpack }) => {
//     // Fix for Cloudflare Workers compatibility
//     if (!isServer) {
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         fs: false,
//         net: false,
//         tls: false,
//       };
//     }

//     // Prevent setImmediate polyfill issues by providing a no-op
//     config.plugins.push(
//       new webpack.DefinePlugin({
//         'global.setImmediate': 'setTimeout',
//       })
//     );

//     return config;
//   },
// };

// export default nextConfig;

// // added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
// import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
// initOpenNextCloudflareForDev();

// import type { NextConfig } from "next";

// /** @type {import('next').NextConfig} */
// const nextConfig: NextConfig = {
//   webpack: (config, { isServer }) => {
//     // Cloudflare Workers compatibility
//     if (!isServer) {
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         fs: false,
//         net: false,
//         tls: false,
//       };
//     }

//     // Prevent setImmediate polyfill issues (TS-safe)
//     config.plugins.push({
//       apply(compiler: any) {
//         compiler.hooks.compilation.tap("SetImmediateFix", () => {
//           // no-op
//         });
//       },
//     });

//     return config;
//   },
// };

// export default nextConfig;

// // added by create-cloudflare to enable calling `getCloudflareContext()` in `next dev`
// import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
// initOpenNextCloudflareForDev();

import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import path from "path";

const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.29.136"],
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      {
        source: "/onboarding",
        destination: "/customer-onboarding",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${posthogHost}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
      { source: "/projects", destination: "/ppm/projects" },
      { source: "/projects/tasks", destination: "/ppm/projects/tasks" },
      { source: "/projects/:path*", destination: "/ppm/projects/:path*" },
    ];
  },
  webpack: (config, { isServer }) => {
    // Cloudflare Workers compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;

// ✅ IMPORTANT: only run this in local development
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
