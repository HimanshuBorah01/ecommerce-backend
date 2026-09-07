import asyncHandler from "../utils/asyncHandler.js";
import userModel from "../models/user.model.js";

export const getNotificationSettings = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user._id).select("notificationSettings");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.status(200).json({
    success: true,
    notificationSettings: user.notificationSettings,
  });
});

export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { notificationSettings } = req.body;

  if (!notificationSettings || typeof notificationSettings !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid notification settings",
    });
  }

  const allowedKeys = ["orderUpdates", "promotions", "newsletter", "priceDrops", "newArrivals"];
  const sanitized = {};

  for (const key of allowedKeys) {
    if (typeof notificationSettings[key] === "boolean") {
      sanitized[`notificationSettings.${key}`] = notificationSettings[key];
    }
  }

  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    { $set: sanitized },
    { new: true, runValidators: true }
  ).select("notificationSettings");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Notification settings updated",
    notificationSettings: user.notificationSettings,
  });
});
