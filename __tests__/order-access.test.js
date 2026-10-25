import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `m-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("multi-seller order access control", () => {
  test("seller owning only one item cannot change a multi-seller order status", async () => {
    const sellerA = await createUser({ role: "seller" });
    const sellerB = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerAToken = await login(sellerA.email, sellerA.password);

    const productA = await createProduct(sellerA.user._id, 10);
    const productB = await createProduct(sellerB.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: productA._id.toString(), quantity: 1 });
    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: productB._id.toString(), quantity: 1 });

    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    const orderId = orderRes.body.order._id;
    expect(orderRes.body.order.items.length).toBe(2);

    // Seller A (owns only item A) tries to confirm -> must be 403
    const res = await request(app).put(`/api/v1/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${sellerAToken}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("access");
  });

  test("seller owning all items in a single-seller order can update status", async () => {
    const sellerA = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerAToken = await login(sellerA.email, sellerA.password);

    const productA = await createProduct(sellerA.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: productA._id.toString(), quantity: 1 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    const orderId = orderRes.body.order._id;

    const res = await request(app).put(`/api/v1/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${sellerAToken}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("confirmed");
  });
});
