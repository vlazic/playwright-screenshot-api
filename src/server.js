import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createBrowserService } from "./services/browser/index.js";
import { createCacheService } from "./services/cache/index.js";
import { createRouter, configureCacheServing } from "./routes/index.js";
import { createLoggingMiddleware } from "./services/logging/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Initialize application services
 * @returns {Promise<Object>}
 */
export const initializeServices = async () => {
  // Initialize cache service
  const cacheService = createCacheService({
    directory: path.join(__dirname, "../cache"),
  });

  // Initialize browser service
  const browserService = await createBrowserService();

  return {
    cacheService,
    browserService,
  };
};

/**
 * Create and configure Express application
 * @param {Object} services
 * @returns {express.Application}
 */
export const createApp = (services) => {
  const app = express();

  // Middleware
  app.use(createLoggingMiddleware());
  app.use(express.json());

  // Configure cache directory serving
  configureCacheServing(app, path.join(__dirname, "../cache"));

  // Configure routes
  app.use(createRouter(services));

  return app;
};

/**
 * Start the server
 * @param {number} port
 * @returns {Promise<void>}
 */
const startServer = async (port) => {
  try {
    const services = await initializeServices();
    const app = createApp(services);

    // Handle cleanup on shutdown
    const cleanup = async () => {
      console.log("\nShutting down...");
      await services.browserService.dispose();
      services.cacheService.dispose();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 3000;
  startServer(port);
}
