/**
 * Wraps an async Express route handler and automatically forwards
 * any rejected Promise or thrown error to Express error-handling middleware.
 *
 * @param {Function} fn - Async Express route handler.
 * @returns {Function} Express middleware with automatic async error handling.
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
