import { createApp } from "../src/server.js";
import { createBrowserService } from "../src/services/browser/index.js";
import { createCacheService } from "../src/services/cache/index.js";
import express from "express";
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

  // Serve test files
  app.use(express.static(TEST_CACHE_DIR));

  return {
    app,
    cacheService,
    browserService,
  };
};

// Create a simple test HTML page
export const createTestPage = (content, port = 3000) => {
  if (!fs.existsSync(TEST_CACHE_DIR)) {
    fs.mkdirSync(TEST_CACHE_DIR, { recursive: true });
  }

  const filename = "test.html";
  const testPagePath = path.join(TEST_CACHE_DIR, filename);
  const htmlContent =
    content ||
    `<!DOCTYPE html>
<html>
  <head>
    <title>Test Page</title>
    <style>
      .hidden { display: none; }
      .target { 
        width: 100px; 
        height: 100px; 
        background: blue;
        position: relative;
        z-index: 1;
      }
      #toggleBtn { 
        padding: 10px; 
        margin: 10px;
        position: relative;
        z-index: 2;
      }
      .ads { 
        padding: 20px; 
        background: #eee;
        position: relative;
        z-index: 1;
      }
    </style>
  </head>
  <body>
    <div id="main">
      <div class="target">Target Element</div>
      <button id="toggleBtn" onclick="document.querySelector('.target').classList.toggle('hidden')">Toggle</button>
      <div class="ads">Advertisement</div>
    </div>
    <script>
      // Ensure elements are ready for testing
      document.addEventListener('DOMContentLoaded', () => {
        const target = document.querySelector('.target');
        const toggleBtn = document.querySelector('#toggleBtn');
        const ads = document.querySelector('.ads');
        
        if (target && toggleBtn && ads) {
          target.style.display = 'block';
          toggleBtn.style.display = 'block';
          ads.style.display = 'block';
        }
      });
    </script>
  </body>
</html>`;

  fs.writeFileSync(testPagePath, htmlContent);
  return `http://localhost:${port}/${filename}`;
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
