import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import productModel from "../src/models/product.model.js";
import passwordService from "../src/services/password.service.js";
// order.test.js
// Integration tests for the order endpoints.
// Uses in-file helpers (createUser, loginUser, createProduct) to keep tests isolated and deterministic.
// Randomized emails/phones are used to avoid unique index collisions in the test DB.


const makeRandomEmail = () => `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const makeRandomPhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

// Helper: createUser({ role }) - inserts a user in DB and returns { user, email, password }

async function createUser({ role = "user" } = {}) {
  const password = "Password@123";
  const user = await userModel.create({
    name: `Test ${role}`,
    email: makeRandomEmail(),
    phone: makeRandomPhone(),
    password: await passwordService.hashPassword(password),
    role,
  });

  return { user, email: user.email, password };
}
// Helper: loginUser(email, password) - performs /auth/login and returns accessToken (asserts status 200)


async function loginUser(email, password) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);
  return response.body.accessToken;
  }
// Helper: createProduct(...) - creates a product document used in tests, accepts overrides and returns the product model instance


async function createProduct(sellerId) {
  return productModel.create({
    name: "Order Product",
    description: "A product for order tests",
    price: 120,
    stock: 10,
    category: "Home",
    images: [{ url: "https://example.com/order.png", fileId: "order-file-id" }],
    seller: sellerId,
  });
}

// Test suite: verifies API behavior and basic happy/error flows for this resource

describe("Order API", () => {
  test("should create an order, retrieve it, and update order status", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);
    const sellerToken = await loginUser(seller.email, seller.password);

    const product = await createProduct(seller.user._id);

    const addressResponse = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer $buyerToken`)
      .send({
        fullName: "First Buyer",
        phone: "9123456789",
        addressLine1: "123 Market Street",
        city: "Delhi",
        state: "Delhi",
        pinCode: "110001",
        country: "India",
        isDefault: true,
      });

    expect(addressResponse.status).toBe(201);

    const productResponse = await request(app)
      .post("/api/v1/cart/add")
      .set("Authorization", `Bearer $buyerToken`)
      .send({ productId: product._id.toString(), quantity: 2 });

    expect(productResponse.status).toBe(201);

    const orderResponse = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer $buyerToken`)
      .send({
        addressId: addressResponse.body.address._id,
        paymentMethod: "cod",
      });

    expect(orderResponse.status).toBe(201);
    expect(orderResponse.body.success).toBe(true);
    expect(orderResponse.body.order.totalAmount).toBe(240);

    const orderId = orderResponse.body.order._id;

    const myOrdersResponse = await request(app)
      .get("/api/v1/orders/my-orders")
      .set("Authorization", `Bearer $buyerToken`)

    expect(myOrdersResponse.status).toBe(200);
    expect(myOrdersResponse.body.count).toBe(1);

    const getOrderResponse = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer $buyerToken`)

    expect(getOrderResponse.status).toBe(200);
    expect(getOrderResponse.body.order._id).toBe(orderId);

    const sellerOrdersResponse = await request(app)
      .get("/api/v1/orders/seller-orders")
      .set("Authorization", `Bearer $buyerToken`)

    expect(sellerOrdersResponse.status).toBe(200);
    expect(sellerOrdersResponse.body.count).toBe(1);

    const updateStatusResponse = await request(app)
      .put(`/api/v1/orders/${orderId}/status`)
      .set("Authorization", `Bearer $buyerToken`)
      .send({ status: "delivered" });

    expect(updateStatusResponse.status).toBe(200);
    expect(updateStatusResponse.body.success).toBe(true);
    expect(updateStatusResponse.body.order.status).toBe("delivered");
    expect(updateStatusResponse.body.order.paymentStatus).toBe("paid");
  });
});