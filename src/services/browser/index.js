import playwright from "playwright";
import {
  createBrowserConfig,
  createScreenshotConfig,
  defaults,
} from "../../config/index.js";

/**
 * Create browser service
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const createBrowserService = async (options = {}) => {
  const browserConfig = createBrowserConfig(options);
  const browser = await playwright.chromium.launch();

  /**
   * Create context with given options
   * @param {Object} contextOptions
   * @returns {Promise<import('playwright').BrowserContext>}
   */
  const createContext = async (contextOptions = {}) => {
    const config = createScreenshotConfig(contextOptions);
    const viewport = {
      width: config.width || defaults.screenshot.defaultWidth,
      height: config.height || defaults.screenshot.defaultHeight,
    };

    return browser.newContext({
      viewport,
      deviceScaleFactor: config.scale || 1,
      userAgent: contextOptions.userAgent || browserConfig.userAgent,
      acceptDownloads: false,
      bypassCSP: true,
      javaScriptEnabled: true,
    });
  };

  /**
   * Take screenshot with given options
   * @param {string} url
   * @param {Object} options
   * @returns {Promise<Buffer>}
   */
  const takeScreenshot = async (url, options = {}) => {
    const context = await createContext(options);
    const page = await context.newPage();

    try {
      // Navigate to page
      try {
        await page.goto(url, {
          waitUntil: "networkidle",
          timeout: browserConfig.defaultTimeout,
        });
      } catch (error) {
        // Fallback to domcontentloaded if networkidle fails
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: browserConfig.defaultTimeout,
        });
      }

      // Handle delay
      const delay = options.delay ?? browserConfig.defaultDelay;
      if (delay > 0) {
        await page.waitForTimeout(delay);
      }

      // Handle element interactions
      if (options.clickSelectors) {
        for (const selector of options.clickSelectors) {
          try {
            // Wait for element to be visible and clickable
            await page.waitForSelector(selector, {
              state: "visible",
              timeout: 5000,
            });
            await page.click(selector);
            // Wait for any animations or content changes
            await page.waitForTimeout(500);
          } catch (error) {
            console.warn(`Failed to click element: ${selector}`, error.message);
          }
        }
      }

      // Handle element hiding
      if (options.hideSelectors) {
        for (const selector of options.hideSelectors) {
          try {
            await page.waitForSelector(selector, {
              state: "visible",
              timeout: 2000,
            });
          } catch {
            // Element not found, skip hiding
            continue;
          }
        }
        await page.addStyleTag({
          content: options.hideSelectors
            .map((selector) => `${selector} { display: none !important; }`)
            .join("\n"),
        });
      }

      let screenshot;
      try {
        // Handle specific element capture
        if (options.selector) {
          try {
            const element = await page.waitForSelector(options.selector, {
              state: "visible",
              timeout: 5000,
            });
            if (!element) {
              throw new Error(`Element not found: ${options.selector}`);
            }
          } catch (error) {
            // Convert timeout errors to element not found errors
            if (error.message.includes("Timeout")) {
              throw new Error(`Element not found: ${options.selector}`);
            }
            throw error;
          }
          const screenshotOptions = {
            type: options.format || "png",
            timeout: 5000,
          };
          if (options.format === "jpeg" && options.quality !== undefined) {
            screenshotOptions.quality = options.quality;
          }
          screenshot = await element.screenshot(screenshotOptions);
        }
        // Handle cropping
        else if (options.crop) {
          const { x, y, width, height } = options.crop;
          const screenshotOptions = {
            type: options.format || "png",
            clip: {
              x: Number(x),
              y: Number(y),
              width: Number(width),
              height: Number(height),
            },
          };
          if (options.format === "jpeg" && options.quality !== undefined) {
            screenshotOptions.quality = options.quality;
          }
          screenshot = await page.screenshot(screenshotOptions);
        }
        // Take full screenshot
        else {
          const screenshotOptions = {
            type: options.format || "png",
            fullPage: options.fullPage,
          };
          if (options.format === "jpeg" && options.quality !== undefined) {
            screenshotOptions.quality = options.quality;
          }
          screenshot = await page.screenshot(screenshotOptions);
        }
        return screenshot;
      } catch (error) {
        throw new Error(`Screenshot failed: ${error.message}`);
      }
    } finally {
      await context.close();
    }
  };

  /**
   * Set custom headers for requests
   * @param {Object} headers
   * @returns {Function} Context creation function with headers
   */
  const withHeaders = (headers) => {
    return async (contextOptions) => {
      const context = await createContext(contextOptions);
      await context.setExtraHTTPHeaders(headers);
      return context;
    };
  };

  return {
    takeScreenshot,
    withHeaders,
    dispose: () => browser.close(),
  };
};
