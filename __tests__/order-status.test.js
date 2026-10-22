import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `s-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("seller status updates and stock", () => {
  test("seller cancel restores reserved stock", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerToken = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    expect((await productModel.findById(product._id)).stock).toBe(9);

    const res = await request(app).put(`/api/v1/orders/${orderRes.body.order._id}/status`)
      .set("Authorization", `Bearer ${sellerToken}`).send({ status: "cancelled" });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("cancelled");
    expect((await productModel.findById(product._id)).stock).toBe(10);
  });

  test("forward transitions never touch stock; returned releases once; refunded does not double release", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerToken = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    const orderId = orderRes.body.order._id;
    expect((await productModel.findById(product._id)).stock).toBe(9);

    const setStatus = async (status) =>
      request(app).put(`/api/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${sellerToken}`).send({ status });

    for (const s of ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"]) {
      const r = await setStatus(s);
      expect(r.status).toBe(200);
      expect((await productModel.findById(product._id)).stock).toBe(9);
    }

    // delivered -> returned releases the stock
    expect((await setStatus("returned")).status).toBe(200);
    expect((await productModel.findById(product._id)).stock).toBe(10);

    // returned -> refunded must NOT release a second time
    expect((await setStatus("refunded")).status).toBe(200);
    expect((await productModel.findById(product._id)).stock).toBe(10);
  });
});
