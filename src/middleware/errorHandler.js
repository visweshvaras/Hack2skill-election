/**
 * Global error handling middleware.
 * Captures all unhandled exceptions and returns a standardized JSON response.
 */
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  const status = err.status || 500;
  const response = {
    error: true,
    message: err.message || 'Internal Server Error',
    code: status,
    timestamp: new Date().toISOString()
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = { errorHandler };
