/**
 * SSG_ROUTES — static route manifest for build-time pre-rendering.
 *
 * Only public, static routes without dynamic path params.
 * Dynamic routes (/agents/profile/:agentId, /agents/propose/:requestId)
 * continue to use the SPA shell served by the /* → /index.html catch-all.
 */
export const SSG_ROUTES: string[] = [
  "/",
  "/agents/browse",
];
