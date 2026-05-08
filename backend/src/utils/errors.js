export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.payload = options.payload;
    this.code = options.code;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, options = {}) {
    super(message, 400, options);
  }
}

export class ForbiddenError extends AppError {
  constructor(message, options = {}) {
    super(message, 403, options);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message, options = {}) {
    super(message, 401, options);
  }
}

export class NotFoundError extends AppError {
  constructor(message, options = {}) {
    super(message, 404, options);
  }
}

export class ConflictError extends AppError {
  constructor(message, options = {}) {
    super(message, 409, options);
  }
}