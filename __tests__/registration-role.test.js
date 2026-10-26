import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";

const email = () => `e-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

describe("registration role escalation", () => {
  test("client-supplied role is ignored; new users are always 'user'", async () => {
    for (const role of ["seller"]) {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: email(),
        phone: phone(),
        password: "Password@123",
        confirmPassword: "Password@123",
        role,
      });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("user");
    }
  });
});
