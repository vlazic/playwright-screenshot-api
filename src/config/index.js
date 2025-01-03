import {
  defaults,
  isValidFormat,
  isValidDevice,
  isValidDimensions,
  isValidDelay,
  isValidScale,
  isValidCacheTTL,
} from "./defaults.js";

/**
 * Configuration error class
 */
class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Create screenshot configuration
 * @param {Object} options
 * @returns {Object}
 * @throws {ConfigurationError}
 */
export const createScreenshotConfig = (options = {}) => {
  const config = { ...defaults.screenshot };

  if (options.format) {
    if (!isValidFormat(options.format)) {
      throw new ConfigurationError(`Invalid format: ${options.format}`);
    }
    config.format = options.format.toLowerCase();
  }

  if (options.device) {
    if (!isValidDevice(options.device)) {
      throw new ConfigurationError(`Invalid device: ${options.device}`);
    }
    const deviceConfig = defaults.devices[options.device];
    config.width = deviceConfig.width;
    config.height = deviceConfig.height;
  } else if (options.width || options.height) {
    if (
      !isValidDimensions(
        options.width || config.defaultWidth,
        options.height || config.defaultHeight
      )
    ) {
      throw new ConfigurationError("Invalid dimensions");
    }
    config.width = options.width || config.defaultWidth;
    config.height = options.height || config.defaultHeight;
  }

  if (options.scale !== undefined) {
    if (!isValidScale(options.scale)) {
      throw new ConfigurationError(`Invalid scale: ${options.scale}`);
    }
    config.scale = options.scale;
  }

  if (options.fullPage !== undefined) {
    config.fullPage = Boolean(options.fullPage);
  }

  if (options.quality !== undefined) {
    if (
      !Number.isInteger(options.quality) ||
      options.quality < 0 ||
      options.quality > 100
    ) {
      throw new ConfigurationError(`Invalid quality: ${options.quality}`);
    }
    config.quality = options.quality;
  }

  return config;
};

/**
 * Create cache configuration
 * @param {Object} options
 * @returns {Object}
 * @throws {ConfigurationError}
 */
export const createCacheConfig = (options = {}) => {
  const config = { ...defaults.cache };

  if (options.enabled !== undefined) {
    config.enabled = Boolean(options.enabled);
  }

  if (options.ttlDays !== undefined) {
    if (!isValidCacheTTL(options.ttlDays)) {
      throw new ConfigurationError(`Invalid cache TTL: ${options.ttlDays}`);
    }
    config.ttlDays = options.ttlDays;
  }

  if (options.directory) {
    if (typeof options.directory !== "string" || !options.directory.trim()) {
      throw new ConfigurationError("Invalid cache directory");
    }
    config.directory = options.directory.trim();
  }

  return config;
};

/**
 * Create browser configuration
 * @param {Object} options
 * @returns {Object}
 * @throws {ConfigurationError}
 */
export const createBrowserConfig = (options = {}) => {
  const config = { ...defaults.browser };

  if (options.delay !== undefined) {
    if (!isValidDelay(options.delay)) {
      throw new ConfigurationError(`Invalid delay: ${options.delay}`);
    }
    config.defaultDelay = options.delay;
  }

  if (options.timeout !== undefined) {
    if (!Number.isInteger(options.timeout) || options.timeout < 0) {
      throw new ConfigurationError(`Invalid timeout: ${options.timeout}`);
    }
    config.defaultTimeout = options.timeout;
  }

  if (options.userAgent) {
    if (typeof options.userAgent !== "string" || !options.userAgent.trim()) {
      throw new ConfigurationError("Invalid user agent");
    }
    config.userAgent = options.userAgent.trim();
  }

  return config;
};

export { defaults };
