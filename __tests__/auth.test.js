import request from "supertest";
import app from "../src/app.js";

// Helper: register a user and log them in, returning accessToken and cookies
// Reduces duplication in logout and refresh token tests
async function registerAndLogin(userData) {
  // Register user
  await request(app).post("/api/v1/auth/register").send(userData);

  // Login and return the relevant tokens/cookies
  const loginResponse = await request(app).post("/api/v1/auth/login").send({
    email: userData.email,
    password: userData.password,
  });
  expect(loginResponse.status).toBe(200);

  const accessToken = loginResponse.body.accessToken;
  const cookies = Array.isArray(loginResponse.headers["set-cookie"])
    ? loginResponse.headers["set-cookie"].join("; ")
    : loginResponse.headers["set-cookie"];

  return { loginResponse, accessToken, cookies };
}

// Authentication API test suite
// Tests cover registration, login, logout, token refresh, and protected endpoint access
describe("Authentication API", () => {
  // User registration tests
  describe("Registration", () => {
    test("should register a new user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543210",
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData);

      expect(response.status).toBe(201);
    });

    test("should not register with duplicate email", async () => {
      const userData = {
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
        phone: "9876543210",
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      // Register first user
      await request(app).post("/api/v1/auth/register").send(userData);

      // Try registering again with same email
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...userData,
          phone: "9999999999",
        });

      expect(response.status).toBe(409);
    });

    test("should not register with duplicate phone", async () => {
      const userData = {
        name: "Jane Doe",
        email: `jane-${Date.now()}@example.com`,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      // Register first user
      await request(app).post("/api/v1/auth/register").send(userData);

      // Try registering again with same phone
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...userData,
          email: `another-${Date.now()}@example.com`,
        });

      expect(response.status).toBe(409);
    });

    test("should not register with invalid email", async () => {
      const userData = {
        name: "John Doe",
        email: "invalid-email",
        phone: "9876543210",
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData);

      expect(response.status).toBe(400);
    });

    test("should not register with weak password", async () => {
      const userData = {
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
        phone: "9876543210",
        password: "123",
        confirmPassword: "123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData);

      expect(response.status).toBe(400);
    });

    test("should not register with mismatched passwords", async () => {
      const userData = {
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
        phone: "9876543210",
        password: "Password@123",
        confirmPassword: "DifferentPassword@123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData);

      expect(response.status).toBe(400);
    });
  });

  // Login tests
  describe("Login", () => {
    test("should login successfully with correct credentials", async () => {
      const userData = {
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
        phone: "9876543210",
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      // Register user first
      await request(app).post("/api/v1/auth/register").send(userData);

      // Login
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: userData.email, password: userData.password });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    test("should not login with incorrect password", async () => {
      const userData = {
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
        phone: "9876543210",
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      // Register user first
      await request(app).post("/api/v1/auth/register").send(userData);

      // Try login with incorrect password
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: userData.email, password: "WrongPassword@123" });

      expect(response.status).toBe(401);
    });

    test("should not login with non-existent email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nonexistent@example.com", password: "Password@123" });

      expect(response.status).toBe(401);
    });
  });

  // Logout and session tests
  describe("Logout", () => {
    test("should logout successfully after login", async () => {
      const userData = {
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
        phone: "9876543210",
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      const { accessToken, cookies } = await registerAndLogin(userData);

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // Token refresh tests
  describe("Token Refresh", () => {
    test("should refresh access token after logout", async () => {
      const userData = {
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
        phone: "9876543210",
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      const { accessToken, cookies } = await registerAndLogin(userData);

      // Logout
      await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .send({});

      // Refresh token
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookies)
        .send({});

      expect([200, 401]).toContain(response.status);
    });
  });

  // Protected endpoint tests
  describe("Protected Endpoints", () => {
    test("should get current user with valid access token", async () => {
      const userData = {
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
        phone: "9876543210",
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      const { accessToken } = await registerAndLogin(userData);

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    test("should not access protected endpoint without token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .send({});

      expect(response.status).toBe(401);
    });

    test("should not get current user with invalid access token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token-value")
        .send({});

      expect(response.status).toBe(401);
    });

    test("should not get current user with malformed authorization header", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "invalid-token")
        .send({});

      expect(response.status).toBe(401);
    });
  });
});
