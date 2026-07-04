import ApiError from "../utils/ApiError.js";
import config from "../config/config.js";

/**
 * Global error-handling middleware.
 * Handles all errors thrown in the application and sends
 * a consistent JSON response to the client.
 *
 * @param {Error} err - Error object.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next function.
 */
const errorMiddleware = (err, req, res, next) => {
  let error = err;
  // Handle invalid MongoDB ObjectId
  if (error.name === "CastError") {
    error = new ApiError(404, "Resource not found");
  }

  // Handle duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];

    error = new ApiError(
      409,
      `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    );
  }

  // Handle mongoose validation errors
  if (error.name === "ValidationError") {
    const validationErrors = Object.values(error.errors).map(
      (validationError) => validationError.message,
    );

    error = new ApiError(400, "Validation failed", validationErrors);
  }

  // Handle invalid JWT
  if (error.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token");
  }

  // Handle expired JWT
  if (error.name === "TokenExpiredError") {
    error = new ApiError(401, "Token has expired");
  }

  // Convert unknown errors into ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    error = new ApiError(statusCode, message, error.errors || [], error.stack);
  }

  return res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    errors: error.errors,
    stack: config.NODE_ENV === "development" ? error.stack : undefined,
  });
};

export default errorMiddleware;
