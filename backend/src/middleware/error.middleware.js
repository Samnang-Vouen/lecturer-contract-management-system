// Express error and 404 middleware for consistent, graceful failures

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Server error';
  const payload = { success: false, message };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }
  // Minimal structured log
  console.error('[ERROR]', status, message);
  return res.status(status).json(payload);
};
