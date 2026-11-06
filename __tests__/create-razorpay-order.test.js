import request from "supertest";
import crypto from "crypto";
import app from "../src/app.js";
import config from "../src/config/config.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `z-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("createRazorpayOrder payable checks", () => {
  test("rejects creating Razorpay intent for a COD order", async () => {
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

    const res = await request(app).post("/api/v1/payment/order")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Razorpay orders");
  });

  test("rejects creating Razorpay intent for an already-paid order", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "razorpay" });
    const orderId = orderRes.body.order._id;

    // Verify payment -> paid
    const payRes = await request(app).post("/api/v1/payment/order")
      .set("Authorization", `Bearer ${buyerToken}`).send({ orderId });
    const razorpayOrderId = payRes.body.razorpayOrderId;
    const razorpayPaymentId = "pay_create_after_paid";
    const sig = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    await request(app).post("/api/v1/payment/verify")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ razorpayOrderId, razorpayPaymentId, razorpaySignature: sig });

    // Try to create another Razorpay intent for the paid order -> rejected
    const res = await request(app).post("/api/v1/payment/order")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already");
  });

  test("rejects creating Razorpay intent for a cancelled order", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "razorpay" });
    const orderId = orderRes.body.order._id;

    // Cancel the order (unpaid razorpay order is cancellable)
    await request(app).put(`/api/v1/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${buyerToken}`).send({});

    // Try to create Razorpay intent for cancelled order -> rejected
    const res = await request(app).post("/api/v1/payment/order")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("status");
  });

  test("successfully creates Razorpay intent for a pending razorpay order", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "razorpay" });
    const orderId = orderRes.body.order._id;

    const res = await request(app).post("/api/v1/payment/order")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId });

    expect(res.status).toBe(200);
    expect(res.body.razorpayOrderId).toBeDefined();
  });
});
