import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// buildCommand must be top-level on the OpenNext config.
// defineCloudflareConfig() only accepts CloudflareOverrides and drops unknown keys.
export default {
  ...defineCloudflareConfig({
    // Uncomment to enable R2 cache,
    // It should be imported as:
    // `import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";`
    // See https://opennext.js.org/cloudflare/caching for more details
    // incrementalCache: r2IncrementalCache,
  }),
  buildCommand: "npm run build:next",
};
