import express from "express";
import { subscribeValidationRules } from "../middleware/validation.middleware.js";
import { subscribe } from "../controllers/newsletter.controller.js";

const router = express.Router();

// Subscribe a new email to the newsletter.
// POST /api/v1/newsletter/subscribe
router.post("/subscribe", subscribeValidationRules, subscribe);

export default router;
