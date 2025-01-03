import express from "express";
import playwright from "playwright";
import NodeCache from "node-cache";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "cache");

// Create cache directory if it doesn't exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
} else {
  // Clean up existing cache files on startup
  fs.readdirSync(CACHE_DIR).forEach((file) => {
    const filepath = path.join(CACHE_DIR, file);
    try {
      fs.unlinkSync(filepath);
      console.log(`Cleaned up cached file: ${file}`);
    } catch (err) {
      console.error(`Error cleaning up file ${file}:`, err);
    }
  });
  console.log("Cache directory cleaned");
}

const app = express();
app.use(express.json());
app.use("/cache", express.static(CACHE_DIR));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Initialize cache with default TTL of 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

const browser = await playwright.chromium.launch();

app.post("/screenshot", async (req, res) => {
  const { url, ttl, returnUrl = false } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Check if URL is cached
    const cachedResult = cache.get(url);
    if (cachedResult) {
      if (returnUrl) {
        return res.json({ url: `/cache/${cachedResult}` });
      }
      const imagePath = path.join(CACHE_DIR, cachedResult);
      return res.sendFile(imagePath);
    }

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      javaScriptEnabled: true,
    });
    const page = await context.newPage();

    // Try different waiting strategies
    try {
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000, // 30 seconds timeout
      });
    } catch (error) {
      // If networkidle fails, try with domcontentloaded
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    }

    const screenshot = await page.screenshot();
    await context.close();

    // Generate unique filename and save screenshot
    const filename = `${uuidv4()}.png`;
    const filepath = path.join(CACHE_DIR, filename);
    fs.writeFileSync(filepath, screenshot);

    // Cache the filename with custom TTL if provided
    if (ttl) {
      cache.set(url, filename, ttl);
    } else {
      cache.set(url, filename);
    }

    if (returnUrl) {
      res.json({ url: `/cache/${filename}` });
    } else {
      res.set("Content-Type", "image/png");
      res.send(screenshot);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup expired cache files periodically (every hour)
setInterval(() => {
  const keys = cache.keys();
  const cachedFiles = new Set(keys.map((key) => cache.get(key)));

  // Read cache directory
  fs.readdir(CACHE_DIR, (err, files) => {
    if (err) {
      console.error("Error reading cache directory:", err);
      return;
    }

    // Remove files that are no longer in cache
    files.forEach((file) => {
      if (!cachedFiles.has(file)) {
        fs.unlink(path.join(CACHE_DIR, file), (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
    });
  });
}, 3600000); // Run every hour

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
