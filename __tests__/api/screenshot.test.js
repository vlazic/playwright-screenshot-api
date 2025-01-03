import request from "supertest";
import { setupTestApp, createTestPage } from "../setup.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_CACHE_DIR = path.join(__dirname, "../../test-cache");

describe("Screenshot API", () => {
  let app;
  let testPageUrl;

  beforeAll(async () => {
    const testApp = await setupTestApp();
    app = testApp.app;
    testPageUrl = createTestPage();
  });

  describe("Basic functionality", () => {
    it("should require URL parameter", async () => {
      const response = await request(app).post("/screenshot").send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("URL is required");
    });

    it("should capture basic screenshot", async () => {
      const response = await request(app)
        .post("/screenshot")
        .send({ url: testPageUrl });

      expect(response.status).toBe(200);
      expect(response.type).toBe("image/png");
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it("should handle invalid URLs", async () => {
      const response = await request(app)
        .post("/screenshot")
        .send({ url: "invalid-url" });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid URL format");
    });
  });

  describe("Device emulation", () => {
    it("should capture screenshot with desktop preset", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        device: "desktop",
      });

      expect(response.status).toBe(200);
    });

    it("should capture screenshot with tablet preset", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        device: "tablet",
      });

      expect(response.status).toBe(200);
    });

    it("should capture screenshot with phone preset", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        device: "phone",
      });

      expect(response.status).toBe(200);
    });

    it("should handle invalid device preset", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        device: "invalid-device",
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "Invalid device: invalid-device"
      );
    });
  });

  describe("Format and quality", () => {
    it("should capture PNG screenshot", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        format: "png",
      });

      expect(response.status).toBe(200);
      expect(response.type).toBe("image/png");
    });

    it("should capture JPEG screenshot", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        format: "jpeg",
        quality: 80,
      });

      expect(response.status).toBe(200);
      expect(response.type).toBe("image/jpeg");
    });

    it("should handle invalid format", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        format: "invalid",
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid format: invalid");
    });
  });

  describe("Dimensions and cropping", () => {
    it("should capture screenshot with custom dimensions", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        width: 800,
        height: 600,
      });

      expect(response.status).toBe(200);
    });

    it("should capture full page screenshot", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        fullPage: true,
      });

      expect(response.status).toBe(200);
    });

    it("should capture cropped screenshot", async () => {
      const response = await request(app)
        .post("/screenshot")
        .send({
          url: testPageUrl,
          crop: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          },
        });

      expect(response.status).toBe(200);
    });
  });

  describe("Element interaction", () => {
    it("should click elements before capture", async () => {
      const response = await request(app)
        .post("/screenshot")
        .send({
          url: testPageUrl,
          clickSelectors: ["#toggleBtn"],
        });

      expect(response.status).toBe(200);
    });

    it("should hide elements", async () => {
      const response = await request(app)
        .post("/screenshot")
        .send({
          url: testPageUrl,
          hideSelectors: [".ads"],
        });

      expect(response.status).toBe(200);
    });

    it("should capture specific element", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        selector: ".target",
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Caching", () => {
    it("should cache screenshots", async () => {
      // First request
      const response1 = await request(app)
        .post("/screenshot")
        .send({ url: testPageUrl });

      expect(response1.status).toBe(200);
      expect(response1.header["x-cached"]).toBe("false");

      // Second request (should be cached)
      const response2 = await request(app)
        .post("/screenshot")
        .send({ url: testPageUrl });

      expect(response2.status).toBe(200);
      expect(response2.header["x-cached"]).toBe("true");
    });

    it("should bypass cache with fresh option", async () => {
      // First request
      await request(app).post("/screenshot").send({ url: testPageUrl });

      // Second request with fresh option
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        fresh: true,
      });

      expect(response.status).toBe(200);
      expect(response.header["x-cached"]).toBe("false");
    });

    it("should return URL when returnUrl is true", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        returnUrl: true,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("url");
      expect(response.body.url).toMatch(/^\/cache\/.+$/);
    });
  });

  describe("Error handling", () => {
    it("should handle timeouts gracefully", async () => {
      const response = await request(app).post("/screenshot").send({
        url: "http://localhost:1", // Non-existent server
        timeout: 1000,
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it("should handle invalid selectors", async () => {
      const response = await request(app).post("/screenshot").send({
        url: testPageUrl,
        selector: "#non-existent",
      });

      expect(response.status).toBe(500);
      expect(response.body.error.message).toContain("Element not found");
    });
  });
});
