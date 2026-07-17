import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const getCartItems = (userId) =>
  cartModel
    .find({
      user: userId,
    })
    .populate("product", "name price images stock category");

const toCartEnvelope = (cartItems) => ({
  items: cartItems.map((item) => ({
    _id: item._id,
    product: item.product,
    quantity: item.quantity,
  })),
});

// add product to cart controller
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await productModel.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  if (product.stock < (quantity || 1)) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  // finding existing cart item exist or not
  const existingCartItem = await cartModel.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + (quantity || 1);

    if (newQuantity > product.stock) {
      throw new ApiError(400, "Requested quantity exceeds available stock");
    }
    existingCartItem.quantity = newQuantity;
    await existingCartItem.save();
    const cartItems = await getCartItems(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart: toCartEnvelope(cartItems),
      cartItem: existingCartItem,
      cartItems,
    });
  }

  // if cart item not exist create or add product to cart
  const cart = await cartModel.create({
    user: req.user._id,
    product: productId,
    quantity: quantity || 1,
  });

  const cartItems = await getCartItems(req.user._id);

  return res.status(200).json({
    success: true,
    message: "Product added to cart",
    cart: toCartEnvelope(cartItems),
    cartItem: cart,
    cartItems,
  });
});

// get my all cart items
export const getCart = asyncHandler(async (req, res) => {
  const cartItems = await getCartItems(req.user._id);

  return res.status(200).json({
    success: true,
    count: cartItems.length,
    cart: toCartEnvelope(cartItems),
    cartItems,
  });
});

// remove cart item
export const removeCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let cardItem = await cartModel.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!cardItem) {
    cardItem = await cartModel.findOne({
      product: id,
      user: req.user._id,
    });
  }

  if (!cardItem) {
    throw new ApiError(404, "Cart item not found");
  }

  await cardItem.deleteOne();
  const cartItems = await getCartItems(req.user._id);

  return res.status(200).json({
    success: true,
    message: "Cart item removed successfully",
    cart: toCartEnvelope(cartItems),
    cartItems,
  });
});

// update cart item
export const updateCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { productId, quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new ApiError(400, "Quantity must be greater than 0");
  }
  let cartItem = null;

  if (id) {
    cartItem = await cartModel.findOne({
      _id: id,
      user: req.user._id,
    });
  }

  if (!cartItem && (productId || id)) {
    cartItem = await cartModel.findOne({
      product: productId || id,
      user: req.user._id,
    });
  }

  if (!cartItem) {
    throw new ApiError(404, "Cart item not found");
  }

  const product = await productModel.findById(cartItem.product);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (quantity > product.stock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  cartItem.quantity = quantity; //update quantity
  await cartItem.save();
  const cartItems = await getCartItems(req.user._id);

  return res.status(200).json({
    success: true,
    message: "Cart item updated successfully",
    cart: toCartEnvelope(cartItems),
    cartItem,
    cartItems,
  });
});
