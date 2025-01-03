import fs from "fs";
import path from "path";
import crypto from "crypto";
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
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
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

    try {
      const key = createCacheKey(params);
      const entry = cache.get(key);

      if (!entry) return null;
      if (isExpired(entry, config.ttlDays)) {
        cache.delete(key);
        try {
          await fs.promises.unlink(path.join(cacheDir, entry.filename));
        } catch {
          // Ignore file deletion errors
        }
        return null;
      }

      const filepath = path.join(cacheDir, entry.filename);
      const exists = await fs.promises
        .access(filepath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        cache.delete(key);
        return null;
      }

      return await fs.promises.readFile(filepath);
    } catch (error) {
      console.error("Cache read error:", error);
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

    try {
      const key = createCacheKey(params);
      const filename = `${key}.${params.format || "png"}`;
      const filepath = path.join(cacheDir, filename);

      // Ensure cache directory exists
      await fs.promises.mkdir(cacheDir, { recursive: true });

      // Write file atomically by using a temporary file
      const tempPath = `${filepath}.tmp`;
      await fs.promises.writeFile(tempPath, data);
      await fs.promises.rename(tempPath, filepath);

      cache.set(key, createCacheEntry(filename));
    } catch (error) {
      console.error("Cache write error:", error);
    }
  };

  /**
   * Generate URL for cached screenshot
   * @param {Buffer} data
   * @returns {Promise<string>}
   */
  const generateUrl = async (data) => {
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const filepath = path.join(cacheDir, filename);
    await fs.promises.writeFile(filepath, data);
    return filename;
  };

  /**
   * Clean expired cache entries
   * @returns {Promise<void>}
   */
  const cleanup = async () => {
    if (!config.enabled) return;

    try {
      const expired = new Set();
      const files = new Set();

      // Collect expired entries and all cache files
      for (const [key, entry] of cache.entries()) {
        if (isExpired(entry, config.ttlDays)) {
          expired.add(key);
        }
        files.add(entry.filename);
      }

      // Remove expired entries from cache
      expired.forEach((key) => cache.delete(key));

      // Clean up files
      const existingFiles = await fs.promises.readdir(cacheDir);
      for (const file of existingFiles) {
        const filepath = path.join(cacheDir, file);
        if (!files.has(file) || expired.has(createCacheKey({ url: file }))) {
          try {
            await fs.promises.unlink(filepath);
          } catch {
            // Ignore file deletion errors
          }
        }
      }
    } catch (error) {
      console.error("Cache cleanup error:", error);
    }
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
    generateUrl,
    cleanup,
    clear,
    dispose: () => clearInterval(cleanupInterval),
  };
};
