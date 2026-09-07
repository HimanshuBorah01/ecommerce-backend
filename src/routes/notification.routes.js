import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/settings", protect, getNotificationSettings);

router.patch("/settings", protect, updateNotificationSettings);

export default router;
