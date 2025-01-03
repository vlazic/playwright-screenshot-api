import fs from "fs";
import path from "path";
import { createCacheConfig } from "../../config/index.js";

/**
 * Cache entry type
 * @typedef {Object} CacheEntry
 * @property {string} filename - Cached file name
 * @property {number} timestamp - Cache creation timestamp
 */

/**
 * Create a new cache entry
 * @param {string} filename
 * @returns {CacheEntry}
 */
const createCacheEntry = (filename) => ({
  filename,
  timestamp: Date.now(),
});

/**
 * Check if cache entry is expired
 * @param {CacheEntry} entry
 * @param {number} ttlDays
 * @returns {boolean}
 */
const isExpired = (entry, ttlDays) => {
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  return Date.now() - entry.timestamp > ttlMs;
};

/**
 * Create cache key from request parameters
 * @param {Object} params
 * @returns {string}
 */
const createCacheKey = (params) => {
  const normalized = {
    url: params.url,
    width: params.width || "default",
    height: params.height || "default",
    device: params.device || "none",
    format: params.format || "png",
    scale: params.scale || 1,
    fullPage: params.fullPage || false,
  };
  return Buffer.from(JSON.stringify(normalized)).toString("base64");
};

/**
 * Create cache service
 * @param {Object} options
 * @returns {Object}
 */
export const createCacheService = (options = {}) => {
  const config = createCacheConfig(options);
  const cacheDir = path.resolve(config.directory);
  const cache = new Map();

  // Ensure cache directory exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  /**
   * Get cached screenshot
   * @param {Object} params
   * @returns {Promise<Buffer|null>}
   */
  const get = async (params) => {
    if (!config.enabled) return null;

    const key = createCacheKey(params);
    const entry = cache.get(key);

    if (!entry) return null;
    if (isExpired(entry, config.ttlDays)) {
      cache.delete(key);
      return null;
    }

    try {
      const filepath = path.join(cacheDir, entry.filename);
      return await fs.promises.readFile(filepath);
    } catch (error) {
      console.error("Cache read error:", error);
      cache.delete(key);
      return null;
    }
  };

  /**
   * Save screenshot to cache
   * @param {Object} params
   * @param {Buffer} data
   * @returns {Promise<void>}
   */
  const set = async (params, data) => {
    if (!config.enabled) return;

    const key = createCacheKey(params);
    const filename = `${key}.${params.format || "png"}`;
    const filepath = path.join(cacheDir, filename);

    try {
      await fs.promises.writeFile(filepath, data);
      cache.set(key, createCacheEntry(filename));
    } catch (error) {
      console.error("Cache write error:", error);
    }
  };

  /**
   * Clean expired cache entries
   * @returns {Promise<void>}
   */
  const cleanup = async () => {
    if (!config.enabled) return;

    const expired = new Set();
    for (const [key, entry] of cache.entries()) {
      if (isExpired(entry, config.ttlDays)) {
        expired.add(key);
        try {
          await fs.promises.unlink(path.join(cacheDir, entry.filename));
        } catch (error) {
          console.error("Cache cleanup error:", error);
        }
      }
    }

    expired.forEach((key) => cache.delete(key));
  };

  /**
   * Clear all cache entries
   * @returns {Promise<void>}
   */
  const clear = async () => {
    if (!config.enabled) return;

    try {
      const files = await fs.promises.readdir(cacheDir);
      await Promise.all(
        files.map((file) => fs.promises.unlink(path.join(cacheDir, file)))
      );
      cache.clear();
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  };

  // Start periodic cleanup
  const cleanupInterval = setInterval(cleanup, 60 * 60 * 1000); // Every hour

  return {
    get,
    set,
    cleanup,
    clear,
    dispose: () => clearInterval(cleanupInterval),
  };
};
