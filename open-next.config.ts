import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Cloudflare Workers, through OpenNext. Every page renders per request (the
 * view is decided per request), and the images are static files drawn by
 * `npm run logos`, so there's nothing to cache between requests: no R2 bucket
 * or KV namespace is needed.
 */
export default defineCloudflareConfig({});
