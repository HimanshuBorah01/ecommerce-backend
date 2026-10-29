import request from "supertest";
import crypto from "crypto";
import app from "../src/app.js";
import config from "../src/config/config.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `i-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("payment idempotency (razorpayPaymentId)", () => {
  test("same razorpay_payment_id cannot verify two different orders", async () => {
    const seller = await createUser({ role: "seller" });
    const buyerA = await createUser();
    const buyerB = await createUser();
    const tokenA = await login(buyerA.email, buyerA.password);
    const tokenB = await login(buyerB.email, buyerB.password);
    const productA = await createProduct(seller.user._id, 10);
    const productB = await createProduct(seller.user._id, 10);
    const addressA = await createAddress(buyerA.user._id);
    const addressB = await createAddress(buyerB.user._id);

    // Buyer A creates order A
    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${tokenA}`)
      .send({ productId: productA._id.toString(), quantity: 1 });
    const orderARes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ addressId: addressA._id.toString(), paymentMethod: "razorpay" });
    const orderAId = orderARes.body.order._id;

    // Buyer B creates order B
    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${tokenB}`)
      .send({ productId: productB._id.toString(), quantity: 1 });
    const orderBRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ addressId: addressB._id.toString(), paymentMethod: "razorpay" });
    const orderBId = orderBRes.body.order._id;

    // Get razorpay order IDs for both
    const payARes = await request(app).post("/api/v1/payment/order")
      .set("Authorization", `Bearer ${tokenA}`).send({ orderId: orderAId });
    const razorpayOrderIdA = payARes.body.razorpayOrderId;

    const payBRes = await request(app).post("/api/v1/payment/order")
      .set("Authorization", `Bearer ${tokenB}`).send({ orderId: orderBId });
    const razorpayOrderIdB = payBRes.body.razorpayOrderId;

    // Verify order A with a payment ID
    const razorpayPaymentId = "pay_idempotent_1";
    const sigA = crypto.createHmac("sha256", config.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderIdA}|${razorpayPaymentId}`).digest("hex");
    const verifyA = await request(app).post("/api/v1/payment/verify")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ razorpayOrderId: razorpayOrderIdA, razorpayPaymentId, razorpaySignature: sigA });
    expect(verifyA.status).toBe(200);
    expect(verifyA.body.order.paymentStatus).toBe("paid");

    // Buyer B tries to verify order B with the SAME razorpay_payment_id -> must be rejected
    const sigB = crypto.createHmac("sha256", config.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderIdB}|${razorpayPaymentId}`).digest("hex");
    const verifyB = await request(app).post("/api/v1/payment/verify")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ razorpayOrderId: razorpayOrderIdB, razorpayPaymentId, razorpaySignature: sigB });
    expect(verifyB.status).toBe(400);
    expect(verifyB.body.message).toContain("already been used");
  });
});
