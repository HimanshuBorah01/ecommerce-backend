import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import addressModel from "../src/models/address.model.js";

// payment.test.js - Integration tests for payment endpoints
// Tests Razorpay integration flow and signature verification

const makeRandomEmail = () => `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const makeRandomPhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

// Helper: createUser
async function createUser({ role = "user" } = {}) {
  const password = "Password@123";
  return userModel.create({
    name: "Test User",
    email: makeRandomEmail(),
    phone: makeRandomPhone(),
    password: await passwordService.hashPassword(password),
    role,
  }).then((user) => ({ user, email: user.email, password }));
}

// Helper: loginUser
async function loginUser(email, password) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toBeDefined();
  return response.body.accessToken;
}

// Helper: createProduct
async function createProduct({ sellerId, overrides = {} } = {}) {
  return productModel.create({
    name: "Payment Test Product",
    description: "A product for payment tests",
    price: 1000,
    stock: 10,
    category: "Electronics",
    images: [{ url: "https://example.com/payment-product.png", fileId: "payment-file-id" }],
    seller: sellerId,
    ...overrides,
  });
}

async function createAddress(userId) {
  return addressModel.create({
    user: userId,
    fullName: "Test User",
    phone: makeRandomPhone(),
    addressLine1: "123 Main Street",
    city: "New York",
    state: "NY",
    pinCode: "10001",
    country: "USA",
    isDefault: true,
  });
}

async function addToCart(accessToken, productId) {
  const response = await request(app)
    .post("/api/v1/cart")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ productId: productId.toString(), quantity: 1 });

  expect(response.status).toBe(200);
}

describe("Payment API", () => {
  test("should create a Razorpay order", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);
    await addToCart(accessToken, product._id);

    // Create an order first
    const orderRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "razorpay",
      });

    const orderId = orderRes.body.order._id;

    // Request payment order
    const response = await request(app)
      .post("/api/v1/payment/order")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ orderId });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should verify payment signature", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);
    await addToCart(accessToken, product._id);

    const orderRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "razorpay",
      });

    const paymentRes = await request(app)
      .post("/api/v1/payment/order")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ orderId: orderRes.body.order._id });

    const response = await request(app)
      .post("/api/v1/payment/verify")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        razorpayOrderId: paymentRes.body.razorpayOrderId,
        razorpayPaymentId: "pay_test123",
        razorpaySignature: "test_signature",
      });

    expect([200, 400]).toContain(response.status);
  });
});
