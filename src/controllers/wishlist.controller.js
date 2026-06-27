import productModel from "../models/product.model.js";
import wishlistModel from "../models/wishlist.model.js";

// add product to wishlist
export async function addWishlist(req, res) {
  try {
    const { productId } = req.params;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // find user's wishlist
    let wishlist = await wishlistModel.findOne({
      user: req.user._id,
    });

    // create wishlist if it doesn't exist
    if (!wishlist) {
      wishlist = await wishlistModel.create({
        user: req.user._id,
        products: [],
      });
    }

    const isAlreadyExists = wishlist.products.some(
      (id) => id.toString() === productId,
    );

    if (isAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Product already exist in this wishlist",
      });
    }

    // add product to wishlist
    wishlist.products.push(productId);
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully ",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
