import { createScreenshotConfig } from "../../config/index.js";
import { ConfigurationError } from "../../config/index.js";

/**
 * Screenshot request validation error
 */
class ValidationError extends Error {
  constructor({ message, status = 400 }) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

/**
 * Screenshot error class
 */
class ScreenshotError extends Error {
  constructor({ message, status = 500 }) {
    super(message);
    this.name = "ScreenshotError";
    this.status = status;
  }
}

/**
 * Validate screenshot request parameters
 * @param {Object} params
 * @throws {ValidationError}
 */
const validateRequest = (params) => {
  if (!params.url) {
    throw new ValidationError({
      message: "URL is required",
      status: 400,
    });
  }

  try {
    new URL(params.url);
  } catch {
    throw new ValidationError({
      message: "Invalid URL format",
      status: 400,
    });
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
      throw new ValidationError({
        message:
          "Crop parameters must be numbers and dimensions must be positive",
        status: 400,
      });
    }
  }

  // Validate selectors if provided
  if (params.clickSelectors && !Array.isArray(params.clickSelectors)) {
    throw new ValidationError({
      message: "clickSelectors must be an array",
      status: 400,
    });
  }

  if (params.hideSelectors && !Array.isArray(params.hideSelectors)) {
    throw new ValidationError({
      message: "hideSelectors must be an array",
      status: 400,
    });
  }

  // Validate delay
  if (
    params.delay !== undefined &&
    (typeof params.delay !== "number" ||
      params.delay < 0 ||
      params.delay > 10000)
  ) {
    throw new ValidationError({
      message: "delay must be a number between 0 and 10000",
      status: 400,
    });
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
          cached: "true",
          format: params.format || "png",
        };
      }
    }

    // Take new screenshot
    const screenshotConfig = createScreenshotConfig(params);
    let screenshot;
    try {
      screenshot = await browserService.takeScreenshot(params.url, {
        ...screenshotConfig,
        delay: params.delay,
        clickSelectors: params.clickSelectors,
        hideSelectors: params.hideSelectors,
        selector: params.selector,
        crop: params.crop,
      });
    } catch (error) {
      // Handle element not found errors
      if (error.message.includes("Element not found")) {
        throw new ScreenshotError({
          message: error.message,
          status: 500,
        });
      }
      // Handle other screenshot errors
      throw new ScreenshotError({
        message: error.message,
        status: 500,
      });
    }

    // Cache the result if caching is enabled
    if (cacheService && !params.fresh) {
      await cacheService.set(params, screenshot);
    }

    return {
      data: screenshot,
      cached: "false",
      format: params.format || "png",
    };
  };
};

/**
 * Create error response
 * @param {Error} error
 * @returns {Object}
 */
export const createErrorResponse = (error) => {
  let status = 500;
  if (error instanceof ValidationError) {
    status = 400;
  } else if (error instanceof ConfigurationError) {
    status = 400;
  } else if (error instanceof ScreenshotError) {
    status = 500;
  }

  return {
    error: {
      message: error.message,
      status: error.status || status,
      name: error.name,
    },
  };
};
