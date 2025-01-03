import request from "supertest";
import { setupTestApp } from "../setup.js";

describe("Health Check API", () => {
  let app;

  beforeAll(async () => {
    const testApp = await setupTestApp();
    app = testApp.app;
  });

  it("should return health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: "ok",
        timestamp: expect.any(String),
        version: expect.any(String),
      })
    );
  });

  it("should return ISO formatted timestamp", async () => {
    const response = await request(app).get("/health");
    const timestamp = new Date(response.body.timestamp);

    expect(timestamp.toISOString()).toBe(response.body.timestamp);
  });
});
