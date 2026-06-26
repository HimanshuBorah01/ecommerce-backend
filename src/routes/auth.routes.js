import express from "express";

import { validationMiddleware } from "../middleware/validation.middleware.js";

import { authController } from "../controllers/auth.controller.js";

const router = express.Router();

// User Routes for registration, login, logout
// register new user or create account
// POST /api/v1/auth/register
router.post(
  "/register",
  validationMiddleware.registerValidationRules,
  authController.registerUser,
);

// login user
// POST /api/v1/auth/login
router.post("/login", authController.loginUser);

// logout user
// POST /api/v1/auth/logout
router.post("/logout", authController.logoutUser);

export default router;
