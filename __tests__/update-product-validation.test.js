import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";

const email = () => `u-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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
async function createProduct(sellerId, price = 100, stock = 10) {
  return productModel.create({
    name: "Prod", description: "Desc", price, stock, category: "Cat",
    images: [{ url: "u", fileId: "f" }], seller: sellerId,
  });
}

describe("updateProduct validates price/stock", () => {
  test("rejects NaN price on update", async () => {
    const seller = await createUser({ role: "seller" });
    const token = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 100, 10);

    const res = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("price", "NaN");

    expect(res.status).toBe(400);
    expect((await productModel.findById(product._id)).price).toBe(100);
  });

  test("rejects negative stock on update", async () => {
    const seller = await createUser({ role: "seller" });
    const token = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 100, 10);

    const res = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("stock", -5);

    expect(res.status).toBe(400);
    expect((await productModel.findById(product._id)).stock).toBe(10);
  });

  test("rejects non-integer stock on update", async () => {
    const seller = await createUser({ role: "seller" });
    const token = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 100, 10);

    const res = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("stock", 5.5);

    expect(res.status).toBe(400);
    expect((await productModel.findById(product._id)).stock).toBe(10);
  });

  test("accepts valid price and stock on update", async () => {
    const seller = await createUser({ role: "seller" });
    const token = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 100, 10);

    const res = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("price", 250)
      .field("stock", 20);

    expect(res.status).toBe(200);
    const updated = await productModel.findById(product._id);
    expect(updated.price).toBe(250);
    expect(updated.stock).toBe(20);
  });
});
