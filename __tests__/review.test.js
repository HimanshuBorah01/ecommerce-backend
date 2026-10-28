import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import orderModel from "../src/models/order.model.js";
import addressModel from "../src/models/address.model.js";

const makeRandomEmail = () => `r-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const makeRandomPhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

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

async function loginUser(email, password) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });
  expect(response.status).toBe(200);
  return response.body.accessToken;
}

async function createProduct(sellerId) {
  return productModel.create({
    name: "Review Test Product",
    description: "A product for review tests",
    price: 500,
    stock: 20,
    category: "Electronics",
    images: [{ url: "https://example.com/r.png", fileId: "r-id" }],
    seller: sellerId,
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

async function createDeliveredOrder(userId, productId, addressId) {
  const product = await productModel.findById(productId);
  return orderModel.create({
    user: userId,
    items: [{ product: productId, quantity: 1, price: product.price }],
    totalAmount: 500,
    address: addressId,
    paymentMethod: "cod",
    status: "delivered",
    deliveredAt: new Date(),
  });
}

describe("Review API", () => {
  test("add / update / delete review with correct stats", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const token = await loginUser(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id);
    const address = await createAddress(buyer.user._id);
    await createDeliveredOrder(buyer.user._id, product._id, address._id);

    // add
    let res = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 4, comment: "great" });

    expect(res.status).toBe(201);
    expect(res.body.product.numberOfReviews).toBe(1);
    expect(res.body.product.averageRating).toBe(4);

    // duplicate add rejected
    res = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 2, comment: "again" });
    expect(res.status).toBe(400);

    // update
    res = await request(app)
      .put(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 2, comment: "changed" });
    expect(res.status).toBe(200);
    expect(res.body.product.numberOfReviews).toBe(1);
    expect(res.body.product.averageRating).toBe(2);

    // delete
    res = await request(app)
      .delete(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.product.numberOfReviews).toBe(0);
    expect(res.body.product.averageRating).toBe(0);
  });

  test("two users review same product -> stats reflect both", async () => {
    const seller = await createUser({ role: "seller" });
    const buyerA = await createUser();
    const buyerB = await createUser();
    const tokenA = await loginUser(buyerA.email, buyerA.password);
    const tokenB = await loginUser(buyerB.email, buyerB.password);
    const product = await createProduct(seller.user._id);
    const addressA = await createAddress(buyerA.user._id);
    const addressB = await createAddress(buyerB.user._id);
    await createDeliveredOrder(buyerA.user._id, product._id, addressA._id);
    await createDeliveredOrder(buyerB.user._id, product._id, addressB._id);

    await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ rating: 5, comment: "a" });
    await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ rating: 3, comment: "b" });

    const after = await productModel.findById(product._id);
    expect(after.reviews.length).toBe(2);
    expect(after.numberOfReviews).toBe(2);
    expect(after.averageRating).toBe(4);
  });
});
