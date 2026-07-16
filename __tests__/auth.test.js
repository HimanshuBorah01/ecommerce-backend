import request from "supertest";
import app from "../src/app.js";

describe("Authentication API", () => {
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
      email: "john@example.com",
      phone: "9876543210",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    // Create the first user
    await request(app).post("/api/v1/auth/register").send(userData);

    // Try to create another user with the same email
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
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      password: "Password@123",
      confirmPassword: "Password@123",
    };

    // Create first user
    await request(app).post("/api/v1/auth/register").send(userData);

    // Try again with same phone but different email
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ...userData,
        email: "another@example.com",
      });

    expect(response.status).toBe(409);
  });
});
