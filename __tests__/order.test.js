import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import addressModel from "../src/models/address.model.js";

// order.test.js - Integration tests for order endpoints
// Tests full order lifecycle from cart to delivery

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
    isEmailVerified: true,
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
    name: "Order Test Product",
    description: "A product for order tests",
    price: 500,
    stock: 20,
    category: "Electronics",
    images: [{ url: "https://example.com/order-product.png", fileId: "order-file-id" }],
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

describe("Order API", () => {
  test("should create an order from cart items", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    // Add to cart
    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    // Create order
    const response = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "razorpay",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const productAfterOrder = await productModel.findById(product._id);
    expect(productAfterOrder.stock).toBe(20);
  });

  test("should reduce stock when creating a COD order", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const response = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "cod",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const productAfterOrder = await productModel.findById(product._id);
    expect(productAfterOrder.stock).toBe(19);
  });

  test("should retrieve orders for buyer", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "razorpay",
      });

    const response = await request(app)
      .get("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("seller should retrieve their orders", async () => {
    const seller = await createUser({ role: "seller" });
    const sellerToken = await loginUser(seller.email, seller.password);
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "razorpay",
      });

    const response = await request(app)
      .get("/api/v1/orders/seller-orders")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should allow cancellation for pending orders", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    const createResponse = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "cod",
      });

    const orderId = createResponse.body.order._id;

    const cancelResponse = await request(app)
      .put(`/api/v1/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.success).toBe(true);
    expect(cancelResponse.body.order.status).toBe("cancelled");

    const productAfterCancel = await productModel.findById(product._id);
    expect(productAfterCancel.stock).toBe(20);
  });

  test("should allow cancellation for confirmed, processing, and packed orders", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const sellerToken = await loginUser(seller.email, seller.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    for (const status of ["confirmed", "processing", "packed"]) {
      await request(app)
        .post("/api/v1/cart")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ productId: product._id.toString(), quantity: 1 });

      const createResponse = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          addressId: address._id.toString(),
          paymentMethod: "razorpay",
        });

      const orderId = createResponse.body.order._id;

      // Seller updates order to the target status
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ status });

      const cancelResponse = await request(app)
        .put(`/api/v1/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.order.status).toBe("cancelled");

      // Clear cart for next iteration
      await request(app)
        .delete("/api/v1/cart/clear")
        .set("Authorization", `Bearer ${buyerToken}`);
    }
  });

  test("should reject cancellation for shipped or delivered orders", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const sellerToken = await loginUser(seller.email, seller.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const createResponse = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "razorpay",
      });

    const orderId = createResponse.body.order._id;

    const transitions = [
      "confirmed",
      "processing",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
    ];

    for (const status of transitions) {
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ status });
    }

    const cancelResponse = await request(app)
      .put(`/api/v1/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(cancelResponse.status).toBe(400);
    expect(cancelResponse.body.success).toBe(false);
  });

  test("should allow return for delivered orders within 7 days", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const sellerToken = await loginUser(seller.email, seller.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    const createResponse = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "cod",
      });

    const orderId = createResponse.body.order._id;

    const transitions = [
      "confirmed",
      "processing",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
    ];

    for (const status of transitions) {
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ status });
    }

    const returnResponse = await request(app)
      .put(`/api/v1/orders/${orderId}/return`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ reason: "Product damaged during shipping" });

    expect(returnResponse.status).toBe(200);
    expect(returnResponse.body.success).toBe(true);
    expect(returnResponse.body.order.status).toBe("returned");
    expect(returnResponse.body.order.returnReason).toBe(
      "Product damaged during shipping",
    );

    const productAfterReturn = await productModel.findById(product._id);
    expect(productAfterReturn.stock).toBe(20);
  });

  test("should reject return for non-delivered orders", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const sellerToken = await loginUser(seller.email, seller.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const createResponse = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "razorpay",
      });

    const orderId = createResponse.body.order._id;

    await request(app)
      .put(`/api/v1/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "confirmed" });

    const returnResponse = await request(app)
      .put(`/api/v1/orders/${orderId}/return`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ reason: "Changed my mind" });

    expect(returnResponse.status).toBe(400);
  });

  test("should reject return without a valid reason", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const sellerToken = await loginUser(seller.email, seller.password);
    const product = await createProduct({ sellerId: seller.user._id });
    const address = await createAddress(buyer.user._id);

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const createResponse = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        addressId: address._id.toString(),
        paymentMethod: "razorpay",
      });

    const orderId = createResponse.body.order._id;

    const transitions = [
      "confirmed",
      "processing",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
    ];

    for (const status of transitions) {
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ status });
    }

    const returnResponse = await request(app)
      .put(`/api/v1/orders/${orderId}/return`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ reason: "ab" });

    expect(returnResponse.status).toBe(400);
  });
});
