import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";

const makeRandomEmail = () => `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const makeRandomPhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

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

async function loginUser(email, password) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toBeDefined();

  return response.body.accessToken;
}

async function createProduct({ sellerId, overrides = {} } = {}) {
  return productModel.create({
    name: "Wishlist Product",
    description: "A product for wishlist tests",
    price: 200,
    stock: 5,
    category: "Accessories",
    images: [{ url: "https://example.com/wishlist.png", fileId: "wishlist-file-id" }],
    seller: sellerId,
    ...overrides,
  });
}

describe("Wishlist API", () => {
  test("should add a product to the wishlist", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    const response = await request(app)
      .post(`/api/v1/wishlist/${product._id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/added to wishlist/i);
  });

  test("should return the wishlist for the authenticated user", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    await request(app)
      .post(`/api/v1/wishlist/${product._id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    const response = await request(app)
      .get("/api/v1/wishlist")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.wishlist.products.length).toBe(1);
    expect(response.body.wishlist.products[0]._id).toBe(product._id.toString());
  });

  test("should remove a product from the wishlist", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    await request(app)
      .post(`/api/v1/wishlist/${product._id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    const response = await request(app)
      .delete(`/api/v1/wishlist/${product._id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/removed from wishlist/i);
  });

  test("should not allow adding the same product twice", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    await request(app)
      .post(`/api/v1/wishlist/${product._id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    const duplicateResponse = await request(app)
      .post(`/api/v1/wishlist/${product._id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.success).toBe(false);
  });
});
