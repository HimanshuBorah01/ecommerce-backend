import { body, validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

const validateResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error) => error.msg);
    throw new ApiError(400, "Validation failed", validationErrors);
  }

  next();
};

// validate user registration before schema validation
export const registerValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid Indian mobile number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters"),

  body("role")
    .optional()
    .isIn(["user", "seller"])
    .withMessage("Role must be either 'user' or 'seller'"),

  validateResult,
];

// validate user login before schema validation
export const loginValidationRules = [
  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid Indian mobile number"),

  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error("Email or phone number is required");
    }
    return true;
  }),

  body("password").notEmpty().withMessage("Password is required"),

  validateResult,
];

export const changePasswordValidationRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  validateResult,
];

export const forgotPasswordValidationRules = [
  body("email")
    .trim()
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email address"),

  validateResult,
];

export const resetPasswordValidationRules = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters"),

  validateResult,
];

export const verifyEmailValidationRules = [
  body("token").trim().notEmpty().withMessage("Verification token is required"),

  validateResult,
];

export const createAddressValidationRules = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid Indian mobile number"),

  body("addressLine1")
    .trim()
    .notEmpty()
    .withMessage("Address Line 1 is required"),

  body("city").trim().notEmpty().withMessage("City is required"),

  body("state").trim().notEmpty().withMessage("State is required"),

  body("pinCode")
    .trim()
    .notEmpty()
    .withMessage("PIN code is required")
    .bail()
    .matches(/^\d{6}$/)
    .withMessage("PIN code must be a valid 6-digit Indian PIN code"),

  body("country")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Country cannot be empty"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be true or false"),

  validateResult,
];

export const updateAddressValidationRules = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid Indian mobile number"),

  body("pinCode")
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("PIN code must be a valid 6-digit Indian PIN code"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be true or false"),

  validateResult,
];

export const createProductValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Product name must be between 2 and 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required"),

  body("price")
    .notEmpty()
    .withMessage("Product price is required")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("stock")
    .notEmpty()
    .withMessage("Product stock is required")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Stock cannot be negative"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Product category is required"),

  validateResult,
];

export const updateProductValidationRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Product name must be between 2 and 200 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock cannot be negative"),

  validateResult,
];

export const addReviewValidationRules = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .bail()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Review comment is required")
    .bail()
    .isLength({ max: 1000 })
    .withMessage("Review comment cannot exceed 1000 characters"),

  validateResult,
];

export const updateReviewValidationRules = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Review comment cannot exceed 1000 characters"),

  validateResult,
];

export const addToCartValidationRules = [
  body("productId")
    .trim()
    .notEmpty()
    .withMessage("Product ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),

  validateResult,
];

export const updateCartValidationRules = [
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),

  validateResult,
];
