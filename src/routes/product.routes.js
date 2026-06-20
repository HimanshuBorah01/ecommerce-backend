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
router.post(
  "/create",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  upload.array("image", 10),
  productController.createProduct,
);

// update a my product
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  upload.array("image", 10),
  productController.updateProduct,
);

// delete my product
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  productController.deleteMyProduct,
);

// get my products
router.get(
  "/my-products",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  productController.getMyProducts,
);

// get my product my id
router.get(
  "/my-products/:id",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  productController.getMyProductById,
);

// user product routes
// get all products
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

export default router;
