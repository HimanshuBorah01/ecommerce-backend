import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import mongoose from "mongoose";

const email = () => `e-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

async function createUser({ role = "user" } = {}) {
  const password = "Password@123";
  return userModel.create({
    name: "Test User", email: email(), phone: phone(),
    password: await passwordService.hashPassword(password),
    role, isEmailVerified: true,
  }).then((u) => ({ user: u, email: u.email, password }));
}
async function login(emailAddr, password) {
  const r = await request(app).post("/api/v1/auth/login").send({ email: emailAddr, password });
  return r.body.accessToken;
}
async function createProduct(sellerId, stock = 10) {
  return productModel.create({
    name: "Prod", description: "Desc", price: 100, stock, category: "Cat",
    images: [{ url: "u", fileId: "f" }], seller: sellerId,
  });
}

describe("error middleware CastError handling", () => {
  test("invalid ObjectId format returns 400, not 404", async () => {
    const user = await createUser();
    const token = await login(user.email, user.password);

    // "not-an-id" is not a valid ObjectId -> CastError with kind "ObjectId" -> 400
    const res = await request(app)
      .get("/api/v1/products/not-an-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Invalid ID format");
  });

  test("valid ObjectId that matches nothing returns 404", async () => {
    const user = await createUser();
    const token = await login(user.email, user.password);

    // A valid ObjectId format that doesn't match any product -> 404
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/v1/products/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("not found");
  });
});
