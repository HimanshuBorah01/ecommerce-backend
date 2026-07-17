import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";

const makeRandomEmail = () =>
  `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const makeRandomPhone = () =>
  `9${Math.floor(100000000 + Math.random() * 900000000)}`;

async function createUser({ role = "user" } = {}) {
  const password = "Password@123";
  const user = await userModel.create({
    name: "Test User",
    email: makeRandomEmail(),
    phone: makeRandomPhone(),
    password: await passwordService.hashPassword(password),
    role,
  });

  return { user, email: user.email, password };
}

async function loginUser(email, password) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toBeDefined();

  return response.body.accessToken;
}

async function createProduct({ sellerId, stock = 10, overrides = {} } = {}) {
  return productModel.create({
    name: "Test Product",
    description: "A product for cart tests",
    price: 100,
    stock,
    category: "Electronics",
    images: [{ url: "https://example.com/image.png", fileId: "fake-file-id" }],
    seller: sellerId,
    ...overrides,
  });
}

describe("Cart API", () => {
  test("should add a product to the cart", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);

    const product = await createProduct({ sellerId: seller.user._id });

    const response = await request(app)
      .post("/api/v1/cart/add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.cart).toBeDefined();
    expect(response.body.cart.quantity).toBe(2);
    expect(response.body.cart.product).toBe(product._id.toString());
  });

  test("should not add a product with quantity greater than stock", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({
      sellerId: seller.user._id,
      stock: 5,
    });

    const response = await request(app)
      .post("/api/v1/cart/add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 10 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("should get the cart items for the authenticated user", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    await request(app)
      .post("/api/v1/cart/add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const getResponse = await request(app)
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.count).toBe(1);
    expect(getResponse.body.cartItems[0].product._id).toBe(
      product._id.toString(),
    );
  });

  test("should update the cart item quantity", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    const addResponse = await request(app)
      .post("/api/v1/cart/add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const cartItemId = addResponse.body.cart._id;

    const updateResponse = await request(app)
      .put(`/api/v1/cart/${cartItemId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ quantity: 5 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.cartItem.quantity).toBe(5);
  });

  test("should remove the cart item", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);
    const product = await createProduct({ sellerId: seller.user._id });

    const addResponse = await request(app)
      .post("/api/v1/cart/add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const cartItemId = addResponse.body.cart._id;
    const deleteResponse = await request(app)
      .delete(`/api/v1/cart/${cartItemId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });
});
