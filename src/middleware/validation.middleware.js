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
const registerValidationRules = [
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
const loginValidationRules = [
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


const changePasswordValidationRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  validateResult,
];

const forgotPasswordValidationRules = [
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

const resetPasswordValidationRules = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters"),

  validateResult,
];

const verifyEmailValidationRules = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Verification token is required"),

  validateResult,
];

export const validationMiddleware = {
  registerValidationRules,
  loginValidationRules,
  changePasswordValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
  verifyEmailValidationRules,
};
