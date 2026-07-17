import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
// address.test.js
// Integration tests for the address endpoints.
// Uses in-file helpers (createUser, loginUser, createProduct) to keep tests isolated and deterministic.
// Randomized emails/phones are used to avoid unique index collisions in the test DB.


const makeRandomEmail = () => `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const makeRandomPhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

// Helper: createUser({ role }) - inserts a user in DB and returns { user, email, password }

async function createUser() {
  const password = "Password@123";
  const user = await userModel.create({
    name: "Test User",
    email: makeRandomEmail(),
    phone: makeRandomPhone(),
    password: await passwordService.hashPassword(password),
  });

  return { user, email: user.email, password };
}
// Helper: loginUser(email, password) - performs /auth/login and returns accessToken (asserts status 200)


async function loginUser(email, password) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  // Debug: log login response to help diagnose 401 failures in downstream requests
  // (This will be removed after debugging)
  // eslint-disable-next-line no-console
  console.log('loginUser debug -> status:', response.status, 'body keys:', Object.keys(response.body));

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toBeDefined();

  return response.body.accessToken;
}

// Test suite: verifies API behavior and basic happy/error flows for this resource

describe("Address API", () => {
  test("should create a new address", async () => {
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);

    const response = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer $accessToken`)
      .send({
        fullName: "Jane Doe",
        phone: "9123456789",
        addressLine1: "123 Test Street",
        addressLine2: "Apt 4B",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        country: "India",
        isDefault: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.address.fullName).toBe("Jane Doe");
  });

  test("should retrieve addresses for the authenticated user", async () => {
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);

    await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer $accessToken`)
      .send({
        fullName: "Jane Doe",
        phone: "9123456789",
        addressLine1: "123 Test Street",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        country: "India",
      });

    const response = await request(app)
      .get("/api/v1/addresses")
      .set("Authorization", `Bearer $accessToken`)

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
    expect(response.body.addresses[0].city).toBe("Mumbai");
  });

  test("should retrieve an address by id", async () => {
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);

    const createResponse = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer $accessToken`)
      .send({
        fullName: "Jane Doe",
        phone: "9123456789",
        addressLine1: "123 Test Street",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        country: "India",
      });

    const addressId = createResponse.body.address._id;
    const getResponse = await request(app)
      .get(`/api/v1/addresses/${addressId}`)
      .set("Authorization", `Bearer $accessToken`)

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.address._id).toBe(addressId);
  });

  test("should update an existing address", async () => {
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);

    const createResponse = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer $accessToken`)
      .send({
        fullName: "Jane Doe",
        phone: "9123456789",
        addressLine1: "123 Test Street",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        country: "India",
      });

    const addressId = createResponse.body.address._id;

    const updateResponse = await request(app)
      .put(`/api/v1/addresses/${addressId}`)
      .set("Authorization", `Bearer $accessToken`)
      .send({ city: "Pune", isDefault: true });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.address.city).toBe("Pune");
    expect(updateResponse.body.address.isDefault).toBe(true);
  });

  test("should delete an address", async () => {
    const buyer = await createUser();
    const accessToken = await loginUser(buyer.email, buyer.password);

    const createResponse = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer $accessToken`)
      .send({
        fullName: "Jane Doe",
        phone: "9123456789",
        addressLine1: "123 Test Street",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        country: "India",
      });

    const addressId = createResponse.body.address._id;

    const deleteResponse = await request(app)
      .delete(`/api/v1/addresses/${addressId}`)
      .set("Authorization", `Bearer $accessToken`)

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });
});
