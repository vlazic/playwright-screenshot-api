import express from "express";
import { healthHandler } from "./handlers/health.js";
import {
  createScreenshotHandler,
  createErrorResponse,
} from "./handlers/screenshot.js";

/**
 * Create Express router with configured routes
 * @param {Object} services
 * @returns {express.Router}
 */
export const createRouter = (services) => {
  const router = express.Router();
  const screenshotHandler = createScreenshotHandler(services);

  // Health check endpoint
  router.get("/health", (req, res) => {
    res.json(healthHandler());
  });

  // Screenshot endpoint
  router.post("/screenshot", async (req, res, next) => {
    try {
      const result = await screenshotHandler(req.body);

      if (req.body.returnUrl) {
        // Generate and return URL for the cached screenshot
        const filename = await services.cacheService.generateUrl(result.data);
        res.json({ url: `/cache/${filename}` });
      } else {
        // Send screenshot directly
        res.set("Content-Type", `image/${result.format}`);
        res.set("X-Cached", result.cached);
        res.send(result.data);
      }
    } catch (error) {
      next(error);
    }
  });

  // Error handling middleware
  router.use((err, req, res, next) => {
    console.error("Request error:", err);
    const response = createErrorResponse(err);
    res.status(response.error.status).json(response);
  });

  return router;
};

/**
 * Configure static file serving for cache directory
 * @param {express.Application} app
 * @param {string} cacheDir
 */
export const configureCacheServing = (app, cacheDir) => {
  app.use("/cache", express.static(cacheDir));
};
