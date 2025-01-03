import { createScreenshotConfig } from "../../config/index.js";

/**
 * Screenshot request validation error
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

/**
 * Validate screenshot request parameters
 * @param {Object} params
 * @throws {ValidationError}
 */
const validateRequest = (params) => {
  if (!params.url) {
    throw new ValidationError("URL is required");
  }

  try {
    new URL(params.url);
  } catch {
    throw new ValidationError("Invalid URL format");
  }

  // Validate crop parameters if provided
  if (params.crop) {
    const { x, y, width, height } = params.crop;
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof width !== "number" ||
      typeof height !== "number" ||
      width <= 0 ||
      height <= 0
    ) {
      throw new ValidationError(
        "Crop parameters must be numbers and dimensions must be positive"
      );
    }
  }

  // Validate selectors if provided
  if (params.clickSelectors && !Array.isArray(params.clickSelectors)) {
    throw new ValidationError("clickSelectors must be an array");
  }

  if (params.hideSelectors && !Array.isArray(params.hideSelectors)) {
    throw new ValidationError("hideSelectors must be an array");
  }

  // Validate delay
  if (
    params.delay !== undefined &&
    (typeof params.delay !== "number" ||
      params.delay < 0 ||
      params.delay > 10000)
  ) {
    throw new ValidationError("delay must be a number between 0 and 10000");
  }
};

/**
 * Create screenshot handler
 * @param {Object} services
 * @returns {Function}
 */
export const createScreenshotHandler = ({ browserService, cacheService }) => {
  /**
   * Handle screenshot request
   * @param {Object} params Request parameters
   * @param {Object} options Handler options
   * @returns {Promise<Object>}
   */
  return async (params, options = {}) => {
    validateRequest(params);

    // Check cache first if not forcing fresh screenshot
    if (!params.fresh && cacheService) {
      const cached = await cacheService.get(params);
      if (cached) {
        return {
          data: cached,
          cached: true,
          format: params.format || "png",
        };
      }
    }

    // Take new screenshot
    const screenshotConfig = createScreenshotConfig(params);
    const screenshot = await browserService.takeScreenshot(params.url, {
      ...screenshotConfig,
      delay: params.delay,
      clickSelectors: params.clickSelectors,
      hideSelectors: params.hideSelectors,
      selector: params.selector,
      crop: params.crop,
    });

    // Cache the result if caching is enabled
    if (cacheService && !params.fresh) {
      await cacheService.set(params, screenshot);
    }

    return {
      data: screenshot,
      cached: false,
      format: params.format || "png",
    };
  };
};

/**
 * Create error response
 * @param {Error} error
 * @returns {Object}
 */
export const createErrorResponse = (error) => ({
  error: {
    message: error.message,
    status: error.status || 500,
    name: error.name,
  },
});
