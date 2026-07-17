import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";

// address.test.js - Integration tests for address endpoints
// Uses in-file helpers for test isolation

const makeRandomEmail = () => `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const makeRandomPhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

// Helper: createUser - inserts user in DB
async function createUser({ role = "user" } = {}) {
  const password = "Password@123";
  return userModel.create({
    name: "Test User",
    email: makeRandomEmail(),
    phone: makeRandomPhone(),
    password: await passwordService.hashPassword(password),
    role,
  }).then((user) => ({ user, email: user.email, password }));
}

// Helper: loginUser - performs /auth/login
async function loginUser(email, password) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toBeDefined();
  return response.body.accessToken;
}

describe("Address API", () => {
  test("should create a new address", async () => {
    const user = await createUser();
    const accessToken = await loginUser(user.email, user.password);

    const response = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "USA",
        isDefault: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should retrieve addresses for the authenticated user", async () => {
    const user = await createUser();
    const accessToken = await loginUser(user.email, user.password);

    await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "USA",
        isDefault: true,
      });

    const response = await request(app)
      .get("/api/v1/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.addresses)).toBe(true);
  });

  test("should update an existing address", async () => {
    const user = await createUser();
    const accessToken = await loginUser(user.email, user.password);

    const createRes = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "USA",
        isDefault: true,
      });

    const addressId = createRes.body.address._id;

    const response = await request(app)
      .put(`/api/v1/addresses/${addressId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        street: "456 Oak Avenue",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90001",
        country: "USA",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should delete an address", async () => {
    const user = await createUser();
    const accessToken = await loginUser(user.email, user.password);

    const createRes = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "USA",
        isDefault: true,
      });

    const addressId = createRes.body.address._id;

    const response = await request(app)
      .delete(`/api/v1/addresses/${addressId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
