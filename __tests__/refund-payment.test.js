import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import orderModel from "../src/models/order.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `r-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("refunded status reverses payment", () => {
  test("delivered/paid order -> refunded sets paymentStatus to refunded and restores stock", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerToken = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    // Create a delivered+paid order directly in the DB
    const order = await orderModel.create({
      user: buyer.user._id,
      items: [{ product: product._id, quantity: 1, price: 100 }],
      totalAmount: 100,
      address: address._id,
      shippingAddress: {
        fullName: "Test User",
        phone: phone(),
        addressLine1: "1 St",
        city: "NY",
        state: "NY",
        pinCode: "10001",
        country: "USA",
      },
      paymentMethod: "cod",
      paymentStatus: "paid",
      status: "delivered",
      deliveredAt: new Date(),
    });

    expect(order.paymentStatus).toBe("paid");
    expect(order.status).toBe("delivered");
    // Simulate stock reservation that createOrder would have done
    await productModel.updateOne({ _id: product._id }, { $inc: { stock: -1 } });
    expect((await productModel.findById(product._id)).stock).toBe(9);

    // Refund the order -> paymentStatus should become refunded, stock restored
    const res = await request(app).put(`/api/v1/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "refunded" });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("refunded");
    expect(res.body.order.paymentStatus).toBe("refunded");

    const refundedOrder = await orderModel.findById(order._id);
    expect(refundedOrder.paymentStatus).toBe("refunded");

    // Stock should be restored to 10
    const productAfterRefund = await productModel.findById(product._id);
    expect(productAfterRefund.stock).toBe(10);
  });

  test("returned order -> refunded does not double-release stock (already released on return)", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerToken = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    // Create a returned order directly in DB (stock already restored)
    const order = await orderModel.create({
      user: buyer.user._id,
      items: [{ product: product._id, quantity: 1, price: 100 }],
      totalAmount: 100,
      address: address._id,
      shippingAddress: {
        fullName: "Test User",
        phone: phone(),
        addressLine1: "1 St",
        city: "NY",
        state: "NY",
        pinCode: "10001",
        country: "USA",
      },
      paymentMethod: "cod",
      paymentStatus: "paid",
      status: "returned",
    });

    // Stock was restored on return: back to 10
    await productModel.updateOne({ _id: product._id }, { stock: 10 });
    expect((await productModel.findById(product._id)).stock).toBe(10);

    // returned -> refunded should NOT release stock again
    const res = await request(app).put(`/api/v1/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "refunded" });

    expect(res.status).toBe(200);
    expect(res.body.order.paymentStatus).toBe("refunded");
    expect((await productModel.findById(product._id)).stock).toBe(10);
  });

  test("pending order cannot go directly to refunded (invalid transition)", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await login(buyer.email, buyer.password);
    const sellerToken = await login(seller.email, seller.password);
    const product = await createProduct(seller.user._id, 10);
    const address = await createAddress(buyer.user._id);

    await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const orderRes = await request(app).post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: address._id.toString(), paymentMethod: "cod" });
    const orderId = orderRes.body.order._id;

    const res = await request(app).put(`/api/v1/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "refunded" });
    expect(res.status).toBe(400);
  });
});
