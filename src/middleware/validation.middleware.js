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

  validateResult,
];

const loginValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),

  validateResult,
];

const changePasswordValidationRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

export const validationMiddleware = {
  registerValidationRules,
  loginValidationRules,
};
