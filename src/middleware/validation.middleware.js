import { body, validationResult } from "express-validator";

function validateResult(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  next();
}

// validate user registration before schema validation 
const registerValidationRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),

  body("email").isEmail().withMessage("Email is required"),

  body("phone")
    .isLength({ min: 10, max: 10 })
    .withMessage("Phone number must be 10 digits"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("role")
    .optional()
    .isIn(["user", "seller"])
    .withMessage("Role must be user or seller"),

  validateResult,
];

export const validationMiddleware = {
  registerValidationRules,
};
