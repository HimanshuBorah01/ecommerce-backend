import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import orderModel from "../src/models/order.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `w-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("return window precise check", () => {
  test("exactly 7 days since delivery is allowed", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerToken = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    // Create a delivered order with deliveredAt 7 days minus 1 second ago
    // (so even with test execution time, it stays under 7 days)
    const sevenDaysMinusOneSec = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 1000);
    const order = await orderModel.create({
      user: buyer.user._id,
      items: [{ product: product._id, quantity: 1, price: 100 }],
      totalAmount: 100,
      address: address._id,
      shippingAddress: {
        fullName: "Test User", phone: phone(), addressLine1: "1 St",
        city: "NY", state: "NY", pinCode: "10001", country: "USA",
      },
      paymentMethod: "cod",
      status: "delivered",
      deliveredAt: sevenDaysMinusOneSec,
    });

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/return`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ reason: "not as described" });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("returned");
  });

  test("7 days + 1 millisecond since delivery is rejected", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerToken = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    // Create a delivered order with deliveredAt 7 days + 1ms ago
    const sevenDaysAndOneMsAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 1);
    const order = await orderModel.create({
      user: buyer.user._id,
      items: [{ product: product._id, quantity: 1, price: 100 }],
      totalAmount: 100,
      address: address._id,
      shippingAddress: {
        fullName: "Test User", phone: phone(), addressLine1: "1 St",
        city: "NY", state: "NY", pinCode: "10001", country: "USA",
      },
      paymentMethod: "cod",
      status: "delivered",
      deliveredAt: sevenDaysAndOneMsAgo,
    });

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/return`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ reason: "not as described" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Return window has expired");
  });

  test("7 days + 1 hour since delivery is rejected", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerToken = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    // Create a delivered order with deliveredAt 7 days + 1 hour ago
    const sevenDaysAndOneHourAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
    const order = await orderModel.create({
      user: buyer.user._id,
      items: [{ product: product._id, quantity: 1, price: 100 }],
      totalAmount: 100,
      address: address._id,
      shippingAddress: {
        fullName: "Test User", phone: phone(), addressLine1: "1 St",
        city: "NY", state: "NY", pinCode: "10001", country: "USA",
      },
      paymentMethod: "cod",
      status: "delivered",
      deliveredAt: sevenDaysAndOneHourAgo,
    });

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/return`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ reason: "not as described" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Return window has expired");
  });
});