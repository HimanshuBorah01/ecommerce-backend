import ApiError from "../utils/ApiError.js";

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

  // Convert unknown errors into ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    error = new ApiError(statusCode, message, [], error.stack);
  }

  return res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    errors: error.errors,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

export default errorMiddleware;
