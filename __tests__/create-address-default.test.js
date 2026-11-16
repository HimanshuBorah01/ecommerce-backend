import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import addressModel from "../src/models/address.model.js";

let phoneCounter = 900000000;
const email = () => `c-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const uniquePhone = () => `9${phoneCounter++}`;

async function createUser() {
  const password = "Password@123";
  return userModel.create({
    name: "Test User",
    email: email(),
    phone: uniquePhone(),
    password: await passwordService.hashPassword(password),
    role: "user",
    isEmailVerified: true,
  }).then((u) => ({ user: u, email: u.email, password }));
}
async function login(emailAddr, password) {
  const r = await request(app).post("/api/v1/auth/login").send({ email: emailAddr, password });
  return r.body.accessToken;
}

describe("createAddress default address invariant", () => {
  test("creating a new default address unsets previous defaults", async () => {
    const { user, email: userEmail, password } = await createUser();
    const token = await login(userEmail, password);

    // Create first address as default
    const res1 = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Test User",
        phone: uniquePhone(),
        addressLine1: "100 First St",
        city: "NY",
        state: "NY",
        pinCode: "10001",
        country: "USA",
        isDefault: true,
      });
    expect(res1.status).toBe(200);
    expect(res1.body.address.isDefault).toBe(true);

    // Create second address as default - first should no longer be default
    const res2 = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Test User",
        phone: uniquePhone(),
        addressLine1: "200 Second St",
        city: "NY",
        state: "NY",
        pinCode: "10001",
        country: "USA",
        isDefault: true,
      });
    expect(res2.status).toBe(200);
    expect(res2.body.address.isDefault).toBe(true);

    // Only one default address exists
    const all = await addressModel.find({ user: user._id });
    const defaults = all.filter((a) => a.isDefault);
    expect(defaults.length).toBe(1);
    expect(defaults[0]._id.toString()).toBe(res2.body.address._id);

    // First address is no longer default
    const addr1After = await addressModel.findById(res1.body.address._id);
    expect(addr1After.isDefault).toBe(false);
  });

  test("creating a non-default address does not affect existing default", async () => {
    const { user, email: userEmail, password } = await createUser();
    const token = await login(userEmail, password);

    // Create first address as default
    const res1 = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Test User",
        phone: uniquePhone(),
        addressLine1: "100 First St",
        city: "NY",
        state: "NY",
        pinCode: "10001",
        country: "USA",
        isDefault: true,
      });
    expect(res1.status).toBe(200);

    // Create second address as non-default
    const res2 = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Test User",
        phone: uniquePhone(),
        addressLine1: "200 Second St",
        city: "NY",
        state: "NY",
        pinCode: "10001",
        country: "USA",
        isDefault: false,
      });
    expect(res2.status).toBe(200);
    expect(res2.body.address.isDefault).toBe(false);

    // First address is still default
    const addr1After = await addressModel.findById(res1.body.address._id);
    expect(addr1After.isDefault).toBe(true);

    // Only one default
    const all = await addressModel.find({ user: user._id });
    expect(all.filter((a) => a.isDefault).length).toBe(1);
  });

  test("concurrent create requests do not cause server errors", async () => {
    const { user, email: userEmail, password } = await createUser();
    const token = await login(userEmail, password);

    // Fire 5 concurrent create requests - all should succeed without 500 errors
    const promises = Array(5)
      .fill(null)
      .map((_, i) =>
        request(app)
          .post("/api/v1/addresses")
          .set("Authorization", `Bearer ${token}`)
          .send({
            fullName: "Test User",
            phone: uniquePhone(),
            addressLine1: `${100 + i} Main St`,
            city: "NY",
            state: "NY",
            pinCode: "10001",
            country: "USA",
            isDefault: i === 0,
          }),
      );

    const responses = await Promise.all(promises);

    // All should succeed (no 500 errors from transaction conflicts)
    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    // At most one default address
    const all = await addressModel.find({ user: user._id });
    const defaults = all.filter((a) => a.isDefault);
    expect(defaults.length).toBeLessThanOrEqual(1);
  });
});
