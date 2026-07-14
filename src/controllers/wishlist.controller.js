import productModel from "../models/product.model.js";
import wishlistModel from "../models/wishlist.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// add product to wishlist
export const addWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await productModel.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
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
    throw new ApiError(400, "Product already exists in the wishlist");
  }

  // add product to wishlist
  wishlist.products.addToSet(productId);
  await wishlist.save();

  return res.status(200).json({
    success: true,
    message: "Product added to wishlist successfully",
  });
});

// get wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistModel
    .findOne({
      user: req.user._id,
    })
    .populate({
      path: "products",
      select: "name price images stock averageRating numberOfReviews category",
    });

  if (!wishlist) {
    return res.status(200).json({
      success: true,
      wishlist: [],
    });
  }

  return res.status(200).json({
    success: true,
    wishlist,
  });
});

export const removeWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await wishlistModel.findOne({
    user: req.user._id,
  });

  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  const isProductExist = wishlist.products.some(
    (id) => id.toString() === productId,
  );

  if (!isProductExist) {
    throw new ApiError(404, "Product not found in wishlist");
  }

  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId,
  );

  await wishlist.save();

  return res.status(200).json({
    success: true,
    message: "Product removed from wishlist successfully",
  });
});
