import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import orderModel from "../src/models/order.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `g-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("getSellerOrders filters items by seller", () => {
  test("seller only sees their own items in a multi-seller order", async () => {
    const sellerA = await createUser({ role: "seller" });
    const sellerB = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerAToken = await login(sellerA.email, sellerA.password);
    const sellerBToken = await login(sellerB.email, sellerB.password);

    const productA = await createProduct(sellerA.user._id, 10);
    const productB = await createProduct(sellerB.user._id, 10);
    const address = await createAddress(buyer.user._id);

    // Buyer adds both products to cart
    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: productA._id.toString(), quantity: 1 });
    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: productB._id.toString(), quantity: 1 });

    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    const orderId = orderRes.body.order._id;
    expect(orderRes.body.order.items.length).toBe(2);

    // Seller A gets their orders
    const resA = await request(app)
      .get("/api/v1/orders/seller-orders")
      .set("Authorization", `Bearer ${sellerAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.count).toBe(1);
    expect(resA.body.orders.length).toBe(1);
    // Seller A should only see their own item
    expect(resA.body.orders[0].items.length).toBe(1);
    expect(resA.body.orders[0].items[0].product.seller).toBe(sellerA.user._id.toString());
    expect(resA.body.orders[0].items[0].product.name).toBe("Prod");

    // Seller B gets their orders
    const resB = await request(app)
      .get("/api/v1/orders/seller-orders")
      .set("Authorization", `Bearer ${sellerBToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.count).toBe(1);
    expect(resB.body.orders[0].items.length).toBe(1);
    expect(resB.body.orders[0].items[0].product.seller).toBe(sellerB.user._id.toString());
  });

  test("seller with no products gets empty orders list", async () => {
    const seller = await createUser({ role: "seller" });
    const token = await login(seller.email, seller.password);

    const res = await request(app)
      .get("/api/v1/orders/seller-orders")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.orders).toEqual([]);
  });
});