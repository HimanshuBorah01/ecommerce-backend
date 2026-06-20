import express from "express";

import {validationMiddleware} from "../middleware/validation.middleware.js"

import { authController } from "../controllers/auth.controller.js";

const router = express.Router();

// User Routes for registration, login, logout
router.post("/register", validationMiddleware.registerValidationRules, authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logoutUser);


export default router;
