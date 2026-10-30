import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";

const email = () => `n-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("product price/stock reject NaN/Infinity", () => {
  test("cannot create product with NaN price", async () => {
    const seller = await createUser({ role: "seller" });
    const token = await login(seller.email, seller.password);

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Product",
        description: "A test product",
        price: NaN,
        stock: 10,
        category: "Cat",
        images: [{ url: "u", fileId: "f" }],
      });

    expect(res.status).toBe(400);
    expect((await productModel.findOne({ seller: seller.user._id }))).toBeNull();
  });

  test("cannot create product with Infinity price", async () => {
    const seller = await createUser({ role: "seller" });
    const token = await login(seller.email, seller.password);

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Product",
        description: "A test product",
        price: Infinity,
        stock: 10,
        category: "Cat",
        images: [{ url: "u", fileId: "f" }],
      });

    expect(res.status).toBe(400);
    expect((await productModel.findOne({ seller: seller.user._id }))).toBeNull();
  });

  test("cannot create product with NaN stock", async () => {
    const seller = await createUser({ role: "seller" });
    const token = await login(seller.email, seller.password);

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Product",
        description: "A test product",
        price: 100,
        stock: NaN,
        category: "Cat",
        images: [{ url: "u", fileId: "f" }],
      });

    expect(res.status).toBe(400);
    expect((await productModel.findOne({ seller: seller.user._id }))).toBeNull();
  });

  test("can create product with valid finite price and stock", async () => {
    const seller = await createUser({ role: "seller" });
    const token = await login(seller.email, seller.password);

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Test Product")
      .field("description", "A test product")
      .field("price", 100)
      .field("stock", 10)
      .field("category", "Cat")
      .attach("image", Buffer.from("fake-image"), "test.png");

    expect(res.status).toBe(200);
    const product = await productModel.findOne({ seller: seller.user._id });
    expect(product).not.toBeNull();
    expect(product.price).toBe(100);
    expect(product.stock).toBe(10);
  });

  test("model validator rejects NaN price directly", async () => {
    const seller = await createUser({ role: "seller" });

    await expect(
      productModel.create({
        name: "Test",
        description: "Desc",
        price: NaN,
        stock: 10,
        category: "Cat",
        images: [{ url: "u", fileId: "f" }],
        seller: seller.user._id,
      }),
    ).rejects.toThrow();
  });

  test("model validator rejects Infinity stock directly", async () => {
    const seller = await createUser({ role: "seller" });

    await expect(
      productModel.create({
        name: "Test",
        description: "Desc",
        price: 100,
        stock: Infinity,
        category: "Cat",
        images: [{ url: "u", fileId: "f" }],
        seller: seller.user._id,
      }),
    ).rejects.toThrow();
  });
});
