import express from "express";
import multer from "multer";

import { productController } from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

// multer is using for accepting data in  file or buffer format
const upload = multer({
  storage: multer.memoryStorage(),
});

const router = express.Router();

// seller product routes
// product create route
// POST /api/v1/products/create
router.post(
  "/create",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  upload.array("image", 10),
  productController.createProduct,
);

// update a my product
// PUT /api/v1/products/:id
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  upload.array("image", 10),
  productController.updateProduct,
);

// delete my product
// DELETE /api/v1/products/:id
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  productController.deleteMyProduct,
);

// get my products
// GET /api/v1/products/my-products
router.get(
  "/my-products",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  productController.getMyProducts,
);

// get my product my id
// GET /api/v1/products/my-products/:id
router.get(
  "/my-products/:id",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  productController.getMyProductById,
);

// public product routes
// GET /api/v1/products     //All products
// GET /api/v1/products?search=iphone     //Search
// GET /api/v1/products?category=Electronics    //Category only
// GET /api/v1/products?search=iphone&category=Electronics    //Search + Category
// GET /api/v1/products?minPrice=10000&maxPrice=70000     // Price Range
// GET /api/v1/products?minPrice=10000&maxPrice=70000     //Combined Filters
// GET /api/v1/products?page=1&limit=5    // First 5 products Pagination
// GET /api/v1/products?search=iphone&category=Electronics&minPrice=10000&maxPrice=100000&page=1&limit=5    //Combined Everything
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// add review to product
// POST /api/v1/products/:id/reviews
router.post(
  "/:id/reviews",
  authMiddleware.protect,
  authMiddleware.userOnly,
  productController.addReview,
);

// update review
// PUT /api/v1/products/:id/reviews
router.put(
  "/:id/reviews",
  authMiddleware.protect,
  authMiddleware.userOnly,
  productController.updateReview,
);

// delete review 
// DELETE /api/v1/products/:id/reviews
router.delete(
  "/:id/reviews",
  authMiddleware.protect,
  authMiddleware.userOnly,
  productController.deleteReview,
);
export default router;
