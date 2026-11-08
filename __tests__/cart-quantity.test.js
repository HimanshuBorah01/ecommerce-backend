import request from "supertest";
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import passwordService from "../src/services/password.service.js";
import productModel from "../src/models/product.model.js";
import cartModel from "../src/models/cart.model.js";
import addressModel from "../src/models/address.model.js";

const email = () => `c-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

describe("cart quantity string coercion", () => {
  test("string quantity is coerced to number when adding to cart", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const token = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id, 100, 10);
    const address = await createAddress(buyer.user._id);

    // Add quantity as a string "2"
    let res = await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: "2" });

    expect(res.status).toBe(200);
    expect(res.body.cartItem.quantity).toBe(2);
    expect(typeof res.body.cartItem.quantity).toBe("number");

    // Add more quantity as a string "3" -> should be 2 + 3 = 5, not "23"
    res = await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: "3" });

    expect(res.status).toBe(200);
    expect(res.body.cartItem.quantity).toBe(5); // 2 + 3 = 5, not "23"
    expect(typeof res.body.cartItem.quantity).toBe("number");

    // Stock check should work: adding "9" more would make 5 + 9 = 14 > 10
    res = await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: "9" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("exceeds available stock");
  });

  test("update cart item with string quantity", async () => {
    const seller = await createUser({ role: "seller" });
    const buyer = await createUser();
    const token = await login(buyer.email, buyer.password);
    const product = await createProduct(seller.user._id, 100, 10);
    const address = await createAddress(buyer.user._id);

    // Add item with quantity 2
    await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    const cartItem = await cartModel.findOne({
      user: buyer.user._id,
      product: product._id,
    });
    expect(cartItem).not.toBeNull();

    // Update quantity as string "7"
    const res = await request(app)
      .put(`/api/v1/cart/${cartItem._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: "7" });

    expect(res.status).toBe(200);
    expect(res.body.cartItem.quantity).toBe(7);
    expect(typeof res.body.cartItem.quantity).toBe("number");
  });
});
