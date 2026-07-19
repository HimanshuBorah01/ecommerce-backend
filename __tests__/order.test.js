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
});
