import request from "supertest";

import app from "../src/app.js";
import config from "../src/config/config.js";

describe("App basics", () => {
  test("should return health status", async () => {
    const response = await request(app).get("/health").send({});

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  test("should allow configured client origin", async () => {
    const response = await request(app)
      .options("/api/v1/auth/login")
      .set("Origin", config.CLIENT_URL)
      .send({});

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      config.CLIENT_URL,
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("should reject oversized JSON requests", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send({
        email: "test@example.com",
        password: "a".repeat(1024 * 1024),
      });

    expect(response.status).toBe(413);
  });
});
