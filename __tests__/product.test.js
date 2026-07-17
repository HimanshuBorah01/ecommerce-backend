import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";

// product.test.js - Integration tests for product endpoints
// Tests product CRUD operations and basic error flows

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

describe("Product API", () => {
  test("should get all products", async () => {
    const response = await request(app)
      .get("/api/v1/products")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("seller should create a new product", async () => {
    const seller = await createUser({ role: "seller" });
    const accessToken = await loginUser(seller.email, seller.password);

    const response = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "New Product",
        description: "A test product",
        price: 299.99,
        stock: 50,
        category: "Electronics",
        images: [{ url: "https://example.com/product.png", fileId: "test-file-id" }],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should update a product", async () => {
    const seller = await createUser({ role: "seller" });
    const accessToken = await loginUser(seller.email, seller.password);

    const createRes = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Original Product",
        description: "Original description",
        price: 199.99,
        stock: 100,
        category: "Electronics",
        images: [{ url: "https://example.com/product.png", fileId: "test-file-id" }],
      });

    const productId = createRes.body.product._id;

    const response = await request(app)
      .put(`/api/v1/products/${productId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        price: 149.99,
        stock: 75,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
