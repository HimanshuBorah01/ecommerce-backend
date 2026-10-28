import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import orderModel from "../src/models/order.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `s-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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
async function createProduct(sellerId, price = 100, stock = 10) {
  return productModel.create({
    name: "Prod", description: "Desc", price, stock, category: "Cat",
    images: [{ url: "u", fileId: "f" }], seller: sellerId,
  });
}
async function createAddress(userId) {
  return addressModel.create({
    user: userId, fullName: "Test User", phone: phone(), addressLine1: "1 St",
    city: "NY", state: "NY", pinCode: "10001", country: "USA", isDefault: true,
  });
}

describe("order item price snapshot", () => {
  test("historical order retains snapshotted price after product price edit", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id, 100, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 2 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.order.totalAmount).toBe(200);

    // Edit the product price AFTER the order was placed
    await productModel.updateOne({ _id: product._id }, { price: 999 });

    // Fetch the order - item price should still be 100 (snapshot), not 999
    const order = await orderModel
      .findOne({ _id: orderRes.body.order._id, user: buyer.user._id })
      .populate("items.product", "price name");
    expect(order.items[0].price).toBe(100); // snapshot preserved
    expect(order.totalAmount).toBe(200); // total unchanged

    // The live product price changed, but order doesn't reflect it
    const liveProduct = await productModel.findById(product._id);
    expect(liveProduct.price).toBe(999);
  });

  test("createOrder validates item price", async () => {
    // This test just confirms the schema change doesn't break creation
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id, 100, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const res = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    expect(res.status).toBe(201);
    expect(res.body.order.items[0].price).toBe(100);
  });
});
