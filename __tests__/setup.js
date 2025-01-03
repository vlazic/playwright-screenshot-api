import { createApp } from "../src/server.js";
import { createBrowserService } from "../src/services/browser/index.js";
import { createCacheService } from "../src/services/cache/index.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_CACHE_DIR = path.join(__dirname, "../test-cache");

// Ensure test cache directory exists
if (!fs.existsSync(TEST_CACHE_DIR)) {
  fs.mkdirSync(TEST_CACHE_DIR, { recursive: true });
}

// Clean test cache before each test
beforeEach(() => {
  if (fs.existsSync(TEST_CACHE_DIR)) {
    const files = fs.readdirSync(TEST_CACHE_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(TEST_CACHE_DIR, file));
    }
  } else {
    fs.mkdirSync(TEST_CACHE_DIR, { recursive: true });
  }
});

// Initialize test services and app
export const setupTestApp = async () => {
  const cacheService = createCacheService({
    directory: TEST_CACHE_DIR,
    ttlDays: 1,
  });

  const browserService = await createBrowserService();

  const app = createApp({
    cacheService,
    browserService,
  });

  return {
    app,
    cacheService,
    browserService,
  };
};

// Create a simple test HTML page
export const createTestPage = (content) => {
  const testPagePath = path.join(TEST_CACHE_DIR, "test.html");
  fs.writeFileSync(
    testPagePath,
    content ||
      `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Page</title>
        <style>
          .hidden { display: none; }
          .target { width: 100px; height: 100px; background: blue; }
        </style>
      </head>
      <body>
        <div class="target">Target Element</div>
        <button id="toggleBtn" onclick="document.querySelector('.target').classList.toggle('hidden')">
          Toggle
        </button>
        <div class="ads">Advertisement</div>
      </body>
    </html>
  `
  );
  return `file://${testPagePath}`;
};

// Cleanup after all tests
afterAll(async () => {
  // Clean test cache directory
  if (fs.existsSync(TEST_CACHE_DIR)) {
    const files = fs.readdirSync(TEST_CACHE_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(TEST_CACHE_DIR, file));
    }
    fs.rmdirSync(TEST_CACHE_DIR);
  }
});
