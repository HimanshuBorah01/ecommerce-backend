import request from "supertest";
import app from "../src/app.js";

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

  
});
