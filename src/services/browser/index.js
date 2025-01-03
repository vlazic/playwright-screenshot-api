import playwright from "playwright";
import {
  createBrowserConfig,
  createScreenshotConfig,
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
    const screenshotConfig = createScreenshotConfig(contextOptions);

    return browser.newContext({
      viewport: {
        width: screenshotConfig.width,
        height: screenshotConfig.height,
      },
      deviceScaleFactor: screenshotConfig.scale,
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
            await page.click(selector, { timeout: 5000 });
            // Wait for any animations or content changes
            await page.waitForTimeout(500);
          } catch (error) {
            console.warn(`Failed to click element: ${selector}`, error.message);
          }
        }
      }

      // Handle element hiding
      if (options.hideSelectors) {
        await page.addStyleTag({
          content: options.hideSelectors
            .map((selector) => `${selector} { display: none !important; }`)
            .join("\n"),
        });
      }

      // Handle specific element capture
      if (options.selector) {
        const element = await page.$(options.selector);
        if (!element) {
          throw new Error(`Element not found: ${options.selector}`);
        }
        return element.screenshot({
          type: options.format || "png",
          quality: options.quality,
        });
      }

      // Handle cropping
      if (options.crop) {
        const { x, y, width, height } = options.crop;
        return page.screenshot({
          type: options.format || "png",
          quality: options.quality,
          clip: {
            x: Number(x),
            y: Number(y),
            width: Number(width),
            height: Number(height),
          },
        });
      }

      // Take full screenshot
      return page.screenshot({
        type: options.format || "png",
        quality: options.quality,
        fullPage: options.fullPage,
      });
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
