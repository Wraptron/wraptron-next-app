import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer, webpack }) => {
    // Fix for Cloudflare Workers compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Prevent setImmediate polyfill issues by providing a no-op
    config.plugins.push(
      new webpack.DefinePlugin({
        'global.setImmediate': 'setTimeout',
      })
    );
    
    return config;
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
