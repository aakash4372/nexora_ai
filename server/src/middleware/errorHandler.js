/**
 * Global error handling middleware for Express.
 * Must have 4 parameters to be recognized by Express as error middleware.
 */

export function notFound(req, res, next) {
  const error = new Error(`Not Found — ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(err, req, res, _next) {
  // If status is still 200 (no explicit status set), default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Only expose stack trace in development
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}
