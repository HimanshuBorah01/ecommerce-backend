import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import orderModel from "../src/models/order.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `v-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("review rating validation", () => {
  test("rejects undefined rating", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const token = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id);
    const address = await createAddress(buyer.user._id);
    await createDeliveredOrder(buyer.user._id, product._id, address._id);

    const res = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ comment: "great" });

    expect(res.status).toBe(400);
  });

  test("rejects null rating", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const token = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id);
    const address = await createAddress(buyer.user._id);
    await createDeliveredOrder(buyer.user._id, product._id, address._id);

    const res = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: null, comment: "great" });

    expect(res.status).toBe(400);
  });

  test("rejects out-of-range rating (0 and 6)", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const token = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id);
    const address = await createAddress(buyer.user._id);
    await createDeliveredOrder(buyer.user._id, product._id, address._id);

    const res0 = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 0, comment: "zero" });
    expect(res0.status).toBe(400);

    const res6 = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 6, comment: "six" });
    expect(res6.status).toBe(400);
  });

  test("accepts valid integer rating 1-5", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const token = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id);
    const address = await createAddress(buyer.user._id);
    await createDeliveredOrder(buyer.user._id, product._id, address._id);

    for (const rating of [1, 2, 3, 4, 5]) {
      const res = await request(app)
        .post(`/api/v1/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating, comment: `rating ${rating}` });

      expect(res.status).toBe(201), `rating ${rating} should be accepted`;
      expect(res.body.product.numberOfReviews).toBe(1);

      // clean up for next iteration
      await productModel.updateOne(
        { _id: product._id },
        { $set: { reviews: [], numberOfReviews: 0, averageRating: 0 } },
      );
    }
  });
});
