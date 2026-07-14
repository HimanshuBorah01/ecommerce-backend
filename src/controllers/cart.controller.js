import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

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

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart: existingCartItem,
    });
  }

  // if cart item not exist create or add product to cart
  const cart = await cartModel.create({
    user: req.user._id,
    product: productId,
    quantity: quantity || 1,
  });

  return res.status(201).json({
    success: true,
    message: "Product added to cart",
    cart,
  });
});

// get my all cart items
export const getCart = asyncHandler(async (req, res) => {
  const cartItems = await cartModel
    .find({
      user: req.user._id,
    })
    .populate("product", "name price images stock category");

  return res.status(200).json({
    success: true,
    count: cartItems.length,
    cartItems,
  });
});

// remove cart item
export const removeCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cardItem = await cartModel.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!cardItem) {
    throw new ApiError(404, "Cart item not found");
  }

  await cardItem.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Cart item removed successfully",
  });
});

// update cart item
export const updateCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new ApiError(400, "Quantity must be greater than 0");
  }
  const cartItem = await cartModel.findOne({
    _id: id,
    user: req.user._id,
  });

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

  return res.status(200).json({
    success: true,
    message: "Cart item updated successfully",
    cartItem,
  });
});
