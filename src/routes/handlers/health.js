/**
 * Health check handler
 * @returns {Object}
 */
export const healthHandler = () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version || "unknown",
});
