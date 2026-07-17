import request from "supertest";
import app from "../src/app.js";

// Helper: register a user and log them in, returning accessToken and cookies
async function registerAndLogin(userData) {
  // register user
  await request(app).post("/api/v1/auth/register").send(userData);

  // login and return the relevant tokens/cookies
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

describe("Authentication API", () => {
  // Test successful user registration
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

  // Prevent duplicate email registration
  test("should not register with duplicate email", async () => {
    const userData = {
      name: "John Doe",
      email: "john@example.com",
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

  // Prevent duplicate phone registration
  test("should not register with duplicate phone", async () => {
    const userData = {
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
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
        email: "another@example.com",
      });

    expect(response.status).toBe(409);
  });

  // Validate email format
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

  // Validate password confirmation
  test("should not register when passwords do not match", async () => {
    const userData = {
      name: "John Doe",
      email: "mismatch@example.com",
      phone: "9999999998",
      password: "Password@123",
      confirmPassword: "Password@321",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate missing required fields
  test("should not register with missing required fields", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({});

    expect(response.status).toBe(400);
  });

  // Validate minimum password length
  test("should not register with password shorter than 6 characters", async () => {
    const userData = {
      name: "John Doe",
      email: "weak@example.com",
      phone: "9876543215",
      password: "12345",
      confirmPassword: "12345",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate missing name
  test("should not register without name", async () => {
    const userData = {
      email: "noname@example.com",
      phone: "9876543216",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate missing email
  test("should not register without email", async () => {
    const userData = {
      name: "John Doe",
      phone: "9876543217",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate missing phone
  test("should not register without phone", async () => {
    const userData = {
      name: "John Doe",
      email: "phone@example.com",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate missing password
  test("should not register without password", async () => {
    const userData = {
      name: "John Doe",
      email: "nopassword@example.com",
      phone: "9876543218",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate missing confirm password
  test("should not register without confirm password", async () => {
    const userData = {
      name: "John Doe",
      email: "noconfirm@example.com",
      phone: "9876543219",
      password: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate email trimming
  test("should register successfully with email containing leading and trailing spaces", async () => {
    const userData = {
      name: "John Doe",
      email: "   trimemail@example.com   ",
      phone: "9876543220",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(201);
  });

  // Validate name trimming
  test("should register successfully with name containing leading and trailing spaces", async () => {
    const userData = {
      name: "   John Doe   ",
      email: "trimname@example.com",
      phone: "9876543221",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(201);
  });

  // Validate short phone number
  test("should not register with phone number shorter than 10 digits", async () => {
    const userData = {
      name: "John Doe",
      email: "shortphone@example.com",
      phone: "987654321",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate long phone number
  test("should not register with phone number longer than 10 digits", async () => {
    const userData = {
      name: "John Doe",
      email: "longphone@example.com",
      phone: "98765432101",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate non-numeric phone
  test("should not register with alphabetic characters in phone number", async () => {
    const userData = {
      name: "John Doe",
      email: "alphabetphone@example.com",
      phone: "98765abcde",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // Validate special characters in phone
  test("should not register with special characters in phone number", async () => {
    const userData = {
      name: "John Doe",
      email: "specialphone@example.com",
      phone: "98765-4321",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(400);
  });

  // ----------------------------------------
  // Login API Tests
  // ----------------------------------------

  describe("Login", () => {
    // Validate successful login
    test("should login successfully with email and password", async () => {
      const registerData = {
        name: "Login User",
        email: `login.${Date.now()}@example.com`,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      // Register the user first
      await request(app).post("/api/v1/auth/register").send(registerData);

      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: registerData.email,
        password: registerData.password,
      });

      if (loginResponse.status !== 200) {
        console.log(loginResponse.body);
      }

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
    });

    // Validate incorrect password
    test("should not login with incorrect password", async () => {
      const userData = {
        name: "Wrong Password User",
        email: `wrongpass.${Date.now()}@example.com`,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      await request(app).post("/api/v1/auth/register").send(userData);

      const response = await request(app).post("/api/v1/auth/login").send({
        email: userData.email,
        password: "WrongPassword@123",
      });

      expect(response.status).toBe(401);
    });

    // Validate unregistered email
    test("should not login with unregistered email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: `nouser.${Date.now()}@example.com`,
          password: "Password@123",
        });

      expect(response.status).toBe(401);
    });

    // Validate missing email
    test("should not login without email", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        password: "Password@123",
      });

      expect(response.status).toBe(400);
    });

    // Validate missing password
    test("should not login without password", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "user@example.com",
      });

      expect(response.status).toBe(400);
    });

    // Validate invalid email format
    test("should not login with invalid email format", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "invalid-email",
        password: "Password@123",
      });

      expect(response.status).toBe(400);
    });
  });

  // ----------------------------------------
  // Logout API Tests
  // ----------------------------------------

  describe("Logout", () => {
    test("should logout successfully with a valid refresh token", async () => {
      const userData = {
        name: "Logout User",
        email: `logout.${Date.now()}@example.com`,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      // register + login helper returns accessToken and cookies
      const { accessToken, cookies } = await registerAndLogin(userData);

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies || "");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should not logout without a refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/logout");

      expect([400, 401]).toContain(response.status);
    });
  });

  // ----------------------------------------
  // Refresh Token API Tests
  // ----------------------------------------

  describe("Refresh Token", () => {
    test("should refresh access token successfully", async () => {
      const userData = {
        name: "Refresh User",
        email: `refresh.${Date.now()}@example.com`,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      await request(app).post("/api/v1/auth/register").send(userData);

      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: userData.email,
        password: userData.password,
      });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers["set-cookie"];

      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .set("Cookie", Array.isArray(cookies) ? cookies.join("; ") : cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    test("should not refresh without refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/refresh-token");

      expect([400, 401]).toContain(response.status);
    });

    test("should not refresh with an invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .set("Cookie", "refreshToken=invalid-token");

      expect(response.status).toBe(401);
    });

    test("should not refresh after logout", async () => {
      const userData = {
        name: "Refresh Logout User",
        email: `refresh.logout.${Date.now()}@example.com`,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      await request(app).post("/api/v1/auth/register").send(userData);

      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: userData.email,
        password: userData.password,
      });

      const accessToken = loginResponse.body.accessToken;
      const cookies = Array.isArray(loginResponse.headers["set-cookie"])
        ? loginResponse.headers["set-cookie"].join("; ")
        : loginResponse.headers["set-cookie"];

      await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);

      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .set("Cookie", cookies);

      expect(response.status).toBe(401);
    });
  });

  // ----------------------------------------
  // Get Current User API Tests
  // ----------------------------------------

  describe("Get Current User", () => {
    test("should get current user profile", async () => {
      const userData = {
        name: "Profile User",
        email: `profile.${Date.now()}@example.com`,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        password: "Password@123",
        confirmPassword: "Password@123",
      };

      await request(app).post("/api/v1/auth/register").send(userData);

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        });

      const accessToken = loginResponse.body.accessToken;

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
    });

    test("should not get current user without access token", async () => {
      const response = await request(app).get("/api/v1/auth/me");
      expect(response.status).toBe(401);
    });

    test("should not get current user with invalid access token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    test("should not get current user with malformed authorization header", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "invalid-token");

      expect(response.status).toBe(401);
    });
  });
});
