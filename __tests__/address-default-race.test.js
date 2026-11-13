import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import addressModel from "../src/models/address.model.js";

const email = () => `a-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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
async function createAddress(userId, override = {}) {
  return addressModel.create({
    user: userId, fullName: "Test User", phone: phone(), addressLine1: "1 St",
    city: "NY", state: "NY", pinCode: "10001", country: "USA", isDefault: true,
    ...override,
  });
}

describe("address default race condition", () => {
  test("concurrent set-default never leaves more than one default", async () => {
    const user = await createUser();
    const token = await login(user.email, user.password);

    const addr1 = await createAddress(user.user._id, { isDefault: true });
    const addr2 = await createAddress(user.user._id, { isDefault: true });

    // Concurrently set both as default
    await Promise.all([
      request(app)
        .put(`/api/v1/addresses/${addr1._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ isDefault: true }),
      request(app)
        .put(`/api/v1/addresses/${addr2._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ isDefault: true }),
    ]);

    // Invariant: at most one default address
    const all = await addressModel.find({ user: user.user._id });
    const defaults = all.filter((a) => a.isDefault);
    expect(defaults.length).toBeLessThanOrEqual(1);
  });

  test("single set-default unsets other defaults", async () => {
    const user = await createUser();
    const token = await login(user.email, user.password);

    const addr1 = await createAddress(user.user._id, { isDefault: false });
    const addr2 = await createAddress(user.user._id, { isDefault: true });

    const res = await request(app)
      .put(`/api/v1/addresses/${addr1._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isDefault: true });

    expect(res.status).toBe(200);
    expect(res.body.address.isDefault).toBe(true);

    const addr2After = await addressModel.findById(addr2._id);
    expect(addr2After.isDefault).toBe(false);

    const all = await addressModel.find({ user: user.user._id });
    expect(all.filter((a) => a.isDefault).length).toBe(1);
  });
});
