import { jest } from "@jest/globals";
// product.test.js
// Integration tests for the product endpoints.
// Uses in-file helpers (createUser, loginUser, createProduct) to keep tests isolated and deterministic.
// Randomized emails/phones are used to avoid unique index collisions in the test DB.


await jest.unstable_mockModule("../src/services/storage.service.js", () => ({
  __esModule: true,
  uploadFile: jest.fn(async () => ({
    fileId: "mock-file-id",
    url: "https://example.com/mock-image.png",
  })),
  deleteFile: jest.fn(async () => ({})),
}));

const requestModule = await import("supertest");
const request = requestModule.default;
const appModule = await import("../src/app.js");
const app = appModule.default;
const userModelModule = await import("../src/models/user.model.js");
const userModel = userModelModule.default;
const passwordServiceModule = await import("../src/services/password.service.js");
const passwordService = passwordServiceModule.default;
const productModelModule = await import("../src/models/product.model.js");
const productModel = productModelModule.default;

const makeRandomEmail = () => `seller-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const makeRandomPhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

async function createSeller() {
  const password = "Password@123";
  const seller = await userModel.create({
    name: "Seller Test",
    email: makeRandomEmail(),
    phone: makeRandomPhone(),
    password: await passwordService.hashPassword(password),
    role: "seller",
  });

  return { seller, email: seller.email, password };
}

// Helper: loginUser(email, password) - performs /auth/login and returns accessToken (asserts status 200)

async function loginUser(email, password) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toBeDefined();

  return response.body.accessToken;
}

// Test suite: verifies API behavior and basic happy/error flows for this resource

describe("Product API", () => {
  test("should create, update, retrieve, and delete a product", async () => {
    const sellerData = await createSeller();
    const accessToken = await loginUser(sellerData.email, sellerData.password);

    const createResponse = await request(app)
      .post("/api/v1/products/create")
      .set("Authorization", `Bearer $accessToken`)
      .field("name", "Test Product")
      .field("description", "The best test product")
      .field("price", "250")
      .field("stock", "15")
      .field("category", "Gadgets")
      .attach("image", Buffer.from([0xff, 0xd8, 0xff]), "product.jpg");

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.product.name).toBe("Test Product");
    expect(createResponse.body.product.images[0].url).toBe("https://example.com/mock-image.png");

    const productId = createResponse.body.product._id;

    const allProductsResponse = await request(app).get("/api/v1/products");
    expect(allProductsResponse.status).toBe(200);
    expect(allProductsResponse.body.count).toBeGreaterThanOrEqual(1);

    const getProductResponse = await request(app).get(`/api/v1/products/${productId}`);
    expect(getProductResponse.status).toBe(200);
    expect(getProductResponse.body.product._id).toBe(productId);

    const updateResponse = await request(app)
      .put(`/api/v1/products/${productId}`)
      .set("Authorization", `Bearer $accessToken`)
      .send({ name: "Updated Product", price: 300 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.product.name).toBe("Updated Product");
    expect(updateResponse.body.product.price).toBe(300);

    const deleteResponse = await request(app)
      .delete(`/api/v1/products/${productId}`)
      .set("Authorization", `Bearer $accessToken`)

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });
});
