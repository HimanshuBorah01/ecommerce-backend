import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";

// add product to cart controller
async function addToCart(req, res) {
  try {
    const { productId, quantity } = req.body;

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // finding existing cart item exist or not
    const existingCartItem = await cartModel.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingCartItem) {
      existingCartItem.quantity += quantity || 1;
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// get my all cart items
async function getCart(req, res) {
  try {
    const cartItems = await cartModel
      .find({
        user: req.user._id,
      })
      .populate("product");

    return res.status(200).json({
      success: true,
      count: cartItems.length,
      cartItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// remove cart item
async function removeCartItem(req, res) {
  try {
    const { id } = req.params;

    const cardItem = await cartModel.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!cardItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    await cardItem.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Cart item removed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// update cart item
async function updateCartItem(req, res) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be gater then 0",
      });
    }
    const cartItem = await cartModel.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    cartItem.quantity = quantity; //update quantity
    await cartItem.save();

    return res.status(200).json({
      success: true,
      message: "Cart item update successfully",
      cartItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export const cartController = {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
};
