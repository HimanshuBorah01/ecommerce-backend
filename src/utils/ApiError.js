/**
 * Custom error class for handling application errors.
 * Extends the built-in JavaScript Error class.
 */
class ApiError extends Error {
  /**
   * Creates a new ApiError.
   *
   * @param {number} statusCode - HTTP status code.
   * @param {string} message - Error message.
   * @param {Array} errors - Additional error details.
   * @param {string} stack - Custom stack trace.
   */
  constructor(statusCode, message, errors = [], stack = "") {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
