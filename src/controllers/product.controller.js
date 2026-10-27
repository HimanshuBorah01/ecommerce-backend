import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import { uploadFile, deleteFile } from "../services/storage.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import productSearchService from "../services/productSearch.service.js";

// Escape regex special characters to prevent ReDoS / unintended patterns.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Sanitize a pagination param to a safe positive integer, with a fallback.
const toPositiveInt = (value, fallback) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

// all seller controllers
// create products
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, category } = req.body;

  // store image file
  const files = req.files;
  const providedImages = Array.isArray(req.body.images) ? req.body.images : [];

  if ((!files || files.length === 0) && providedImages.length === 0) {
    throw new ApiError(400, "At least one image is required");
  }

  const imageUrls = [];
  const uploadedFileIds = [];

  try {
    for (const image of providedImages) {
      if (!image?.url || !image?.fileId) {
        throw new ApiError(400, "Each image must include url and fileId");
      }
      imageUrls.push({
        url: image.url,
        fileId: image.fileId,
      });
    }

    // image file is uploading in array using multer
    for (const file of files || []) {
      const result = await uploadFile(file.buffer.toString("base64"));
      uploadedFileIds.push(result.fileId);
      imageUrls.push({
        url: result.url,
        fileId: result.fileId,
      });
    }

    const product = await productModel.create({
      name,
      description,
      price,
      stock,
      category,
      images: imageUrls,
      seller: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    for (const fileId of uploadedFileIds) {
      try {
        await deleteFile(fileId);
      } catch {}
    }
    throw error;
  }
});

// update my product
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await productModel.findOne({
    _id: id,
    seller: req.user._id,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const { name, description, price, stock, category } = req.body;

  // updating product text data
  if (name) product.name = name;
  if (description) product.description = description;
  if (price !== undefined) product.price = price;
  if (stock !== undefined) product.stock = stock;
  if (category) product.category = category;

  const files = req.files;
  let oldImages;

  if (files && files.length > 0) {
    const imageUrls = [];
    const newUploadedFileIds = [];

    // Upload new images FIRST so the old ones are only removed on success.
    try {
      for (const file of files) {
        const result = await uploadFile(file.buffer.toString("base64"));
        newUploadedFileIds.push(result.fileId);
        imageUrls.push({
          url: result.url,
          fileId: result.fileId,
        });
      }
    } catch (error) {
      // Clean up any successfully uploaded images before rethrowing.
      for (const fileId of newUploadedFileIds) {
        try {
          await deleteFile(fileId);
        } catch {}
      }
      throw error;
    }

    // New uploads succeeded, so it is safe to delete the old images.
    oldImages = product.images;
    product.images = imageUrls;
  }

  await product.save(); // saved

  // Delete old images after successful save so the database is consistent
  // before cloud storage is mutated. If save fails, old images remain intact.
  if (files && files.length > 0) {
    for (const image of oldImages) {
      try {
        await deleteFile(image.fileId);
      } catch {}
    }
  }

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

// delete my product
export const deleteMyProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await productModel
    .findOne({
      _id: id,
      seller: req.user._id,
    })
    .select({ __v: 0 });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Block deletion if any live order still references this product so we do
  // not orphan order items or destroy historical data. Cancelled / returned
  // / refunded orders have already released their stock and are excluded.
  const hasLiveOrders = await orderModel.exists({
    "items.product": product._id,
    status: { $nin: ["cancelled", "returned", "refunded"] },
  });

  if (hasLiveOrders) {
    throw new ApiError(
      400,
      "Cannot delete product: it is referenced by active orders",
    );
  }

  // delete data from cloud storage service
  for (const image of product.images) {
    try {
      await deleteFile(image.fileId);
    } catch {}
  }

  await product.deleteOne(); // delete data from mongoDB

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// get my product by id
export const getMyProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await productModel
    .findOne({
      _id: id,
      seller: req.user._id,
    })
    .select({ __v: 0 });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res.status(200).json({
    success: true,
    product,
  });
});

// get my products
export const getMyProducts = asyncHandler(async (req, res) => {
  const products = await productModel
    .find({
      seller: req.user._id,
    })
    .sort({ createdAt: -1 })
    .select({ __v: 0 });

  return res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// Get autocomplete suggestions
export const autocompleteProducts = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;

  const autocompleteSuggestions = await productSearchService.autocomplete({
    query: q,
    limit: limit ? Number(limit) : undefined,
  });

  return res.status(200).json({
    success: true,
    count: autocompleteSuggestions.length,
    suggestions: autocompleteSuggestions,
  });
});

// all public or user controllers
// get all products and get product by search, category, min max price, Pagination
export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    id,
    page = 1,
    limit = 10,
  } = req.query;
  const query = {};

  // search product (escape regex special chars to prevent ReDoS)
  if (search && typeof search === "string") {
    query.name = {
      $regex: escapeRegex(search.trim()),
      $options: "i",
    };
  }

  // search product by category
  if (category) {
    query.category = {
      $regex: `^${escapeRegex(category).trim()}$`,
      $options: "i",
    };
  }

  // search product by id
  if (id) {
    query._id = id;
  }

  // search product by min max price (handle 0 correctly)
  const parsedMinPrice = Number(minPrice);
  const parsedMaxPrice = Number(maxPrice);

  if (
    minPrice !== undefined &&
    minPrice !== "" &&
    Number.isFinite(parsedMinPrice)
  ) {
    query.price = query.price || {};
    query.price.$gte = parsedMinPrice;
  }
  if (
    maxPrice !== undefined &&
    maxPrice !== "" &&
    Number.isFinite(parsedMaxPrice)
  ) {
    query.price = query.price || {};
    query.price.$lte = parsedMaxPrice;
  }

  const safeLimit = Math.min(toPositiveInt(limit, 10), 50);
  const currentPage = toPositiveInt(page, 1);
  const skip = (currentPage - 1) * safeLimit;
  const totalProducts = await productModel.countDocuments(query);
  const products = await productModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .select({ __v: 0 });
  const totalPages = Math.ceil(totalProducts / safeLimit);

  return res.status(200).json({
    success: true,
    page: currentPage,
    limit: safeLimit,
    totalProducts,
    totalPages,
    count: products.length,
    products,
  });
});

// get product by ID
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productModel
    .findById(id)
    .populate("reviews.user", "name")
    .select({ __v: 0 }); // find by id

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res.status(200).json({
    success: true,
    product,
  });
});

/**
 * Recompute the cached review stats (numberOfReviews, averageRating) from the
 * current review list. Uses an aggregation pipeline update so the values are
 * always derived from the live array and never lost by a concurrent write.
 */
const recalcReviewStats = async (productId) => {
  return productModel.updateOne(
    { _id: productId },
    [
      {
        $set: {
          numberOfReviews: { $size: { $ifNull: ["$reviews", []] } },
          averageRating: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$reviews", []] } }, 0] },
              {
                $divide: [
                  {
                    $sum: {
                      $map: {
                        input: { $ifNull: ["$reviews", []] },
                        as: "review",
                        in: "$$review.rating",
                      },
                    },
                  },
                  { $size: { $ifNull: ["$reviews", []] } },
                ],
              },
              0,
            ],
          },
        },
      },
    ],
    { updatePipeline: true },
  );
};

// add review to product
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment = "" } = req.body;

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const product = await productModel.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // allow review only if product was delivered, returned, or refunded
  const deliveredOrder = await orderModel.findOne({
    user: req.user._id,
    status: {
      $in: ["delivered", "returned", "refunded"],
    },
    "items.product": req.params.id,
  });

  if (!deliveredOrder) {
    throw new ApiError(400, "You can review only products you have received");
  }

  // Push the review atomically so concurrent reviews cannot overwrite each
  // other. The filter blocks a second review from the same user.
  const updated = await productModel.findOneAndUpdate(
    {
      _id: req.params.id,
      "reviews.user": { $ne: req.user._id },
    },
    {
      $push: {
        reviews: {
          user: req.user._id,
          rating,
          comment,
        },
      },
    },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new ApiError(400, "You have already reviewed this product");
  }

  // Recompute cached stats from the current review list.
  await recalcReviewStats(req.params.id);

  const updatedProduct = await productModel.findById(req.params.id);

  return res.status(201).json({
    success: true,
    message: "Review added successfully",
    product: updatedProduct,
  });
});

// update review
export const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment = "" } = req.body;

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const product = await productModel.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Update the caller's own review atomically using the positional operator.
  const updated = await productModel.findOneAndUpdate(
    {
      _id: req.params.id,
      "reviews.user": req.user._id,
    },
    {
      $set: {
        "reviews.$.rating": rating,
        "reviews.$.comment": comment,
      },
    },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new ApiError(404, "Review not found");
  }

  // Recompute cached stats from the current review list.
  await recalcReviewStats(req.params.id);

  const updatedProduct = await productModel.findById(req.params.id);

  return res.status(200).json({
    success: true,
    message: " Review updated successfully",
    product: updatedProduct,
  });
});

// delete review
export const deleteReview = asyncHandler(async (req, res) => {
  const product = await productModel.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Remove the caller's own review atomically.
  const updated = await productModel.findOneAndUpdate(
    {
      _id: req.params.id,
      "reviews.user": req.user._id,
    },
    {
      $pull: {
        reviews: { user: req.user._id },
      },
    },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new ApiError(404, "Review not found");
  }

  // Recompute cached stats from the current review list.
  await recalcReviewStats(req.params.id);

  const updatedProduct = await productModel.findById(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Review deleted successfully",
    product: updatedProduct,
  });
});
