import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import orderModel from "../src/models/order.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `c-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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
async function createAddress(userId) {
  return addressModel.create({
    user: userId, fullName: "Test User", phone: phone(), addressLine1: "1 St",
    city: "NY", state: "NY", pinCode: "10001", country: "USA", isDefault: true,
  });
}

describe("order cancel concurrency", () => {
  test("concurrent cancels do not double-restore stock", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    const orderId = orderRes.body.order._id;
    expect((await productModel.findById(product._id)).stock).toBe(9);

    const url = `/api/v1/orders/${orderId}/cancel`;
    const [r1, r2] = await Promise.all([
      request(app).put(url).set("Authorization", `Bearer ${buyerToken}`).send({}),
      request(app).put(url).set("Authorization", `Bearer ${buyerToken}`).send({}),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 400]);
    expect((await productModel.findById(product._id)).stock).toBe(10);

    const r3 = await request(app).put(url).set("Authorization", `Bearer ${buyerToken}`).send({});
    expect(r3.status).toBe(400);
    expect((await productModel.findById(product._id)).stock).toBe(10);
  });

  test("second return after status change is rejected", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    const orderId = orderRes.body.order._id;

    // Mark order delivered directly (bypassing the status lifecycle)
    await orderModel.updateOne({ _id: orderId }, { status: "delivered", deliveredAt: new Date() });

    expect((await productModel.findById(product._id)).stock).toBe(9);

    const r1 = await request(app).put(`/api/v1/orders/${orderId}/return`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ reason: "not as described" });
    expect(r1.status).toBe(200);
    expect((await productModel.findById(product._id)).stock).toBe(10);

    const r2 = await request(app).put(`/api/v1/orders/${orderId}/return`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ reason: "not as described" });
    expect(r2.status).toBe(400);
    expect((await productModel.findById(product._id)).stock).toBe(10);
  });
});
