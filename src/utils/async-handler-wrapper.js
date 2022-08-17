/**
 * Wraps the handler in try/catch and runs next(err) in catch. Express needs this on async handlers
 * otherwise it won't forward errors to error-handler middleware.
 * @param {Function} handler the (req, res, next) handler function
 */
module.exports = function (handler) {
  return async function (req, res, next) {
      try {
          // Run the handler
          await handler(req, res, next);
      } catch (err) {
          // Sent error to express error-handler middleware
          return next(err);
      }
  }
}