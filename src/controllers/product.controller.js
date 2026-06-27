import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import { uploadFile, deleteFile } from "../services/storage.service.js";

// all seller controllers
// create products
async function createProduct(req, res) {
  try {
    const { name, description, price, stock, category } = req.body;

    // store image file
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const imageUrls = [];

    // image file is uploading in array using multer
    for (const file of files) {
      const result = await uploadFile(file.buffer.toString("base64"));
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

    return res.status(201).json({
      success: true,
      message: "Product list successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// update my product
async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await productModel.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { name, description, price, stock, category } = req.body;

    // updating product text data
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;

    const files = req.files;

    if (files && files.length > 0) {
      const imageUrls = []; // array of images

      // updating images
      for (const file of files) {
        const result = await uploadFile(file.buffer.toString("base64"));
        imageUrls.push({
          url: result.url,
          fileId: result.fileId,
        });
      }
      product.images = imageUrls;
    }
    await product.save(); // saved

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// delete my product
async function deleteMyProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await productModel.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // delete data from cloud storage service
    for (const image of product.images) {
      await deleteFile(image.fileId);
    }

    await product.deleteOne(); // delete data from mongoDB

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// get my product by id
async function getMyProductById(req, res) {
  try {
    const { id } = req.params;

    const product = await productModel.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// get my products
async function getMyProducts(req, res) {
  try {
    const products = await productModel.find({
      seller: req.user._id,
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// all public or user controllers
// get all products and get product by search, category, min max price, Pagination
async function getAllProducts(req, res) {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;
    const query = {};

    // search product
    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    // search product by category
    if (category) {
      query.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    // search product by min max price
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalProducts = await productModel.countDocuments(query);
    const products = await productModel
      .find(query)
      .skip(skip)
      .limit(Number(limit));

    const totalPages = Math.ceil(totalProducts / Number(limit));

    return res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      totalProducts,
      totalPages,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// get product by ID
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await productModel
      .findById(id)
      .populate("reviews.user", "name"); // find by id

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// add review to product
async function addReview(req, res) {
  try {
    const { rating, comment } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const product = await productModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
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
      return res.status(400).json({
        success: false,
        message: "You can review only products you have received",
      });
    }

    // check review user === request user
    const existingReview = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString(),
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    product.reviews.push({
      user: req.user._id,
      rating,
      comment,
    });

    product.numberOfReviews = product.reviews.length;

    product.averageRating =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// update review
async function updateReview(req, res) {
  try {
    const { rating, comment } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const product = await productModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // check review user === request user
    const review = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString(),
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // update review
    review.rating = rating;
    review.comment = comment;

    product.averageRating =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;

    await product.save();

    return res.status(200).json({
      success: true,
      message: " Review updated successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// delete review
async function deleteReview(req, res) {
  try {
    const product = await productModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const review = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString(),
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // delete review
    product.reviews = product.reviews.filter(
      (review) => review.user.toString() !== req.user._id.toString(),
    );

    product.numberOfReviews = product.reviews.length;

    if (product.reviews.length === 0) {
      product.averageRating = 0;
    } else {
      product.averageRating =
        product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviews.length;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export const productController = {
  createProduct,
  updateProduct,
  deleteMyProduct,
  getMyProductById,
  getMyProducts,
  getAllProducts,
  getProductById,
  addReview,
  updateReview,
  deleteReview,
};
