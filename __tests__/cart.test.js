import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import cartModel from "../src/models/cart.model.js";
import productModel from "../src/models/product.model.js";

// cart.test.js
// Integration tests for the cart endpoints.
// Uses in-file helpers (createUser, loginUser, createProduct) to keep tests isolated and deterministic.

const makeRandomEmail = () => `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const makeRandomPhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

// Helper: createUser({ role }) - inserts a user in DB and returns { user, email, password }
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

// Helper: loginUser(email, password) - performs /auth/login and returns accessToken
async function loginUser(email, password) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toBeDefined();
  return response.body.accessToken;
}

// Helper: createProduct(...) - creates a product document for tests
async function createProduct({ sellerId, overrides = {} } = {}) {
  return productModel.create({
    name: "Test Product",
    description: "A product for cart tests",
    price: 100,
    stock: 10,
    category: "Electronics",
    images: [{ url: "https://example.com/product.png", fileId: "product-file-id" }],
    seller: sellerId,
    ...overrides,
  });
}

// Test suite: verifies API behavior and basic happy/error flows
describe("Cart API", () => {
  test("should add a product to cart", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    const response = await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.cart.items.length).toBe(1);
  });

  test("should retrieve user's cart", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    const response = await request(app)
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.cart.items.length).toBe(1);
    expect(response.body.cart.items[0].quantity).toBe(2);
  });

  test("should update cart item quantity", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const response = await request(app)
      .put("/api/v1/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 5 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.cart.items[0].quantity).toBe(5);
  });

  test("should remove item from cart", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const response = await request(app)
      .delete(`/api/v1/cart/${product._id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.cart.items.length).toBe(0);
  });

  test("should fail to add product exceeding stock limit", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id, overrides: { stock: 3 } });

    const response = await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 10 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
