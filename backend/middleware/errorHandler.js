/**
 * 404 Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
}

/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  // Handle invalid JSON body syntax errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Malformed JSON payload in request body"
    });
  }

  // Log error for debugging
  console.error("Server Error:", err.message || err);

  // Return clean 500 response
  res.status(500).json({
    error: "Something went wrong on the server"
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
