import express from "express";
import multer from "multer";

import {
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
} from "../controllers/product.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  createProductValidationRules,
  updateProductValidationRules,
  addReviewValidationRules,
  updateReviewValidationRules,
} from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";

// multer is using for accepting data in  file or buffer format
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

const router = express.Router();
const productCreateMiddlewares = [
  protect,
  authorize(ROLES.SELLER),
  upload.array("image", 10),
  createProductValidationRules,
  createProduct,
];

// seller product routes
// product create route
// POST /api/v1/products/create
router.post("/create", productCreateMiddlewares);
router.post("/", productCreateMiddlewares);

// update a my product
// PUT /api/v1/products/:id
router.put(
  "/:id",
  protect,
  authorize(ROLES.SELLER),
  upload.array("image", 10),
  updateProductValidationRules,
  updateProduct,
);

// delete my product
// DELETE /api/v1/products/:id
router.delete("/:id", protect, authorize(ROLES.SELLER), deleteMyProduct);

// get my products
// GET /api/v1/products/my-products
router.get("/my-products", protect, authorize(ROLES.SELLER), getMyProducts);

// get my product my id
// GET /api/v1/products/my-products/:id
router.get(
  "/my-products/:id",
  protect,
  authorize(ROLES.SELLER),
  getMyProductById,
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
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// add review to product
// POST /api/v1/products/:id/reviews
router.post(
  "/:id/reviews",
  protect,
  authorize(ROLES.USER),
  addReviewValidationRules,
  addReview,
);

// update review
// PUT /api/v1/products/:id/reviews
router.put(
  "/:id/reviews",
  protect,
  authorize(ROLES.USER),
  updateReviewValidationRules,
  updateReview,
);

// delete review
// DELETE /api/v1/products/:id/reviews
router.delete("/:id/reviews", protect, authorize(ROLES.USER), deleteReview);
export default router;
