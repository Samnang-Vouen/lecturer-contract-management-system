import { HTTP_STATUS } from '../config/constants.js';

// Simple zod-based validator middleware
// Usage: validate(schema, 'body' | 'query' | 'params')
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req[source] || {});
      if (!parsed.success) {
        const errors = parsed.error.issues.map((i) => ({
          path: i.path.join('.') || source,
          message: i.message,
        }));
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Validation failed', errors });
      }
      // Attach validated data for downstream usage
      req.validated = req.validated || {};
      req.validated[source] = parsed.data;
      return next();
    } catch (err) {
      return res
        .status(HTTP_STATUS.SERVER_ERROR)
        .json({ message: 'Validator error', error: err?.message || String(err) });
    }
  };
}
