import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import subscriptionModel from "../models/subscription.model.js";
import emailService from "../services/email.service.js";

/**
 * Controller: Newsletter subscription.
 *
 * Flow:
 *   1. Validate the submitted email (done by express-validator middleware).
 *   2. Reject duplicates — an already-subscribed email returns a friendly message.
 *   3. Persist the subscription in the database.
 *   4. Send a "thank you for subscribing" welcome email to the user.
 *
 * The welcome email is best-effort: a temporary email-service outage must not
 * prevent recording the subscription, so email failures are logged and swallowed.
 */
export const subscribe = asyncHandler(async (req, res) => {
  const email = req.body.email;

  try {
    await subscriptionModel.create({ email });
  } catch (error) {
    // Handle duplicate key error (race condition where two concurrent
    // requests for the same email both pass validation).
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "You're already subscribed to our newsletter.",
      });
    }
    throw error;
  }

  emailService
    .sendNewsletterWelcomeEmail(email)
    .catch((err) =>
      console.error("Newsletter welcome email failed:", err.message),
    );

  return res.status(200).json({
    success: true,
    message:
      "Thank you for subscribing! A confirmation email has been sent to your inbox.",
  });
});