import { jest } from "@jest/globals";
// payment.test.js
// Integration tests for the payment endpoints.
// Uses in-file helpers (createUser, loginUser, createProduct) to keep tests isolated and deterministic.
// Randomized emails/phones are used to avoid unique index collisions in the test DB.


await jest.unstable_mockModule("../src/services/razorpay.service.js", () => ({
  __esModule: true,
  default: {
    orders: {
      create: jest.fn(async (options) => ({
        id: "order_test_id",
        ...options,
      })),
    },
  },
}));

const cryptoModule = await import("crypto");
const crypto = cryptoModule.default;
const requestModule = await import("supertest");
const request = requestModule.default;
const appModule = await import("../src/app.js");
const app = appModule.default;
const configModule = await import("../src/config/config.js");
const config = configModule.default;
const userModelModule = await import("../src/models/user.model.js");
const userModel = userModelModule.default;
const productModelModule = await import("../src/models/product.model.js");
const productModel = productModelModule.default;
const passwordServiceModule = await import("../src/services/password.service.js");
const passwordService = passwordServiceModule.default;

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
    name: "Payment Product",
    description: "A product used for payment tests",
    price: 75,
    stock: 20,
    category: "Grocery",
    images: [{ url: "https://example.com/payment.png", fileId: "payment-file-id" }],
    seller: sellerId,
  });
}

// Test suite: verifies API behavior and basic happy/error flows for this resource

describe("Payment API", () => {
  test("should create a Razorpay order and verify payment successfully", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);

    const product = await createProduct(seller.user._id);

    const addressResponse = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer $accessToken`)
      .send({
        fullName: "Payment Buyer",
        phone: "9123456789",
        addressLine1: "56 Payment Lane",
        city: "Bengaluru",
        state: "Karnataka",
        pinCode: "560001",
        country: "India",
        isDefault: true,
      });

    expect(addressResponse.status).toBe(201);

    const cartResponse = await request(app)
      .post("/api/v1/cart/add")
      .set("Authorization", `Bearer $accessToken`)
      .send({ productId: product._id.toString(), quantity: 1 });

    expect(cartResponse.status).toBe(201);

    const orderResponse = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer $accessToken`)
      .send({
        addressId: addressResponse.body.address._id,
        paymentMethod: "razorpay",
      });

    expect(orderResponse.status).toBe(200);
    expect(orderResponse.body.success).toBe(true);
    expect(orderResponse.body.razorpayOrder).toBeDefined();
    expect(orderResponse.body.razorpayOrder.id).toBe("order_test_id");

    const verifySignature = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
      .update(`${orderResponse.body.razorpayOrder.id}|payment_test_id`)
      .digest("hex");

    const verifyResponse = await request(app)
      .post("/api/v1/payment/verify-payment")
      .set("Authorization", `Bearer $accessToken`)
      .send({
        razorpay_order_id: orderResponse.body.razorpayOrder.id,
        razorpay_payment_id: "payment_test_id",
        razorpay_signature: verifySignature,
      });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.success).toBe(true);
    expect(verifyResponse.body.order.paymentStatus).toBe("paid");
  });

  test("should create a legacy Razorpay test order", async () => {
    const buyer = await createUser();
    const buyerToken = await loginUser(buyer.email, buyer.password);

    const response = await request(app)
      .post("/api/v1/payment/create-order")
      .set("Authorization", `Bearer $accessToken`)
      .send({ amount: 150 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.order).toBeDefined();
    expect(response.body.order.id).toBe("order_test_id");
  });
});