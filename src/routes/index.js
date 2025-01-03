import express from "express";
import path from "path";
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

  // Test page endpoint (only in test environment)
  if (process.env.NODE_ENV === "test") {
    router.get("/test-page", (req, res) => {
      res.sendFile(path.join(process.cwd(), "test-cache", "test.html"));
    });
  }

  // Screenshot endpoint
  router.post("/screenshot", async (req, res, next) => {
    try {
      const result = await screenshotHandler(req.body);

      if (req.body.returnUrl) {
        // Generate URL for the screenshot
        const filename = await services.cacheService.generateUrl(
          req.body,
          result.data
        );

        if (filename) {
          // Return URL for cached screenshot
          res.json({ url: `/cache/${filename}` });
        } else {
          // For fresh screenshots, send data directly
          res.set("Content-Type", `image/${result.format}`);
          res.set("X-Cached", "false");
          res.send(result.data);
        }
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
