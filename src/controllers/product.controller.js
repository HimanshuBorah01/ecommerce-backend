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
        $options: `i`,
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
    const product = await productModel.findById(id); // find by id

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

export const productController = {
  createProduct,
  updateProduct,
  deleteMyProduct,
  getMyProductById,
  getMyProducts,
  getAllProducts,
  getProductById,
};
