/**
 * Default configuration values for the screenshot service
 */
export const defaults = {
  // Device presets
  devices: {
    desktop: { width: 1280, height: 800 },
    tablet: { width: 768, height: 1024 },
    phone: { width: 375, height: 667 },
  },

  // Screenshot settings
  screenshot: {
    format: "png",
    defaultWidth: 1024,
    defaultHeight: 768,
    quality: 80, // for JPEG
    fullPage: false,
    scale: 1, // for zoom level (1 = 100%, 2 = 200%, etc.)
  },

  // Cache settings
  cache: {
    enabled: true,
    ttlDays: 14,
    directory: "cache",
  },

  // Browser settings
  browser: {
    defaultDelay: 0,
    maxDelay: 10000,
    defaultTimeout: 30000,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },

  // Element interaction settings
  elements: {
    maxWaitForSelector: 5000,
    defaultHiddenStyle: "visibility: hidden !important",
  },
};

/**
 * Validate screenshot format
 * @param {string} format
 * @returns {boolean}
 */
export const isValidFormat = (format) =>
  ["jpg", "jpeg", "png", "gif"].includes(format.toLowerCase());

/**
 * Validate device name
 * @param {string} device
 * @returns {boolean}
 */
export const isValidDevice = (device) =>
  Object.keys(defaults.devices).includes(device);

/**
 * Validate dimensions
 * @param {number} width
 * @param {number} height
 * @returns {boolean}
 */
export const isValidDimensions = (width, height) =>
  Number.isInteger(width) &&
  Number.isInteger(height) &&
  width > 0 &&
  height > 0;

/**
 * Validate delay time
 * @param {number} delay
 * @returns {boolean}
 */
export const isValidDelay = (delay) =>
  Number.isInteger(delay) && delay >= 0 && delay <= defaults.browser.maxDelay;

/**
 * Validate zoom level
 * @param {number} scale
 * @returns {boolean}
 */
export const isValidScale = (scale) =>
  typeof scale === "number" && scale >= 0.1 && scale <= 5;

/**
 * Validate cache TTL
 * @param {number} days
 * @returns {boolean}
 */
export const isValidCacheTTL = (days) => Number.isInteger(days) && days >= 0;
