import validator from 'validator';

/**
 * Validate email field
 */
export const validateEmail = (fieldName = 'email', required = true) => {
  return (req, res, next) => {
    const email = req.body[fieldName];

    if (!email) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required!`,
        });
      }
      return next();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address!',
      });
    }

    req.body[fieldName] = validator.normalizeEmail(email);
    next();
  };
};

/**
 * Validate password field
 */
export const validatePassword = (fieldName = 'password', minLength = 8) => {
  return (req, res, next) => {
    const password = req.body[fieldName];

    if (!password) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} is required!`,
      });
    }

    if (minLength && password.length < minLength) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${minLength} characters long`,
      });
    }

    next();
  };
};

/**
 * Validate name field
 */
export const validateName = (fieldName = 'name', required = true) => {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (!value) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required`,
        });
      }
      return next();
    }

    const name = validator.trim(value);

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be 2–100 characters`,
      });
    }

    const safeRegex = /^[\p{L}\p{N} 0-9'.,()\-_/&@]+$/u;
    if (!safeRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} contains invalid characters`,
      });
    }

    const bad = /(script|<|>|javascript:|onerror|onload|DROP TABLE|DELETE FROM|INSERT INTO)/i;
    if (bad.test(name)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} contains unsafe content`,
      });
    }

    req.body[fieldName] = name;
    next();
  };
};

/**
 * Validate phone field
 */
export const validatePhone = (fieldName = 'phone', required = false) => {
  return (req, res, next) => {
    const phone = req.body[fieldName];

    if (!phone) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required!`,
        });
      }
      return next();
    }

    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number',
      });
    }

    req.body[fieldName] = validator.escape(validator.trim(phone));
    next();
  };
};

/**
 * Validate ID parameter
 */
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required!`,
      });
    }

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format!`,
      });
    }

    const parsedId = parseInt(id, 10);

    // MySQL INT max value: 2147483647
    if (parsedId <= 0 || parsedId > 2147483647) {
      return res.status(400).json({
        success: false,
        message: `${paramName} out of valid range!`,
      });
    }

    req.params[paramName] = parsedId;
    next();
  };
};

/**
 * Validate string field
 */
export const validateString = (fieldName, minLength, maxLength, required = true) => {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (!value) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required!`,
        });
      }
      return next();
    }

    if (value.length < minLength || value.length > maxLength) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be between ${minLength} and ${maxLength} characters`,
      });
    }

    req.body[fieldName] = validator.escape(validator.trim(value));
    next();
  };
};

/**
 * Validate address field
 */
export const validateAddress = (
  fieldName = 'address',
  minLength = 5,
  maxLength = 200,
  required = false
) => {
  return (req, res, next) => {
    const address = req.body[fieldName];

    if (!address) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required!`,
        });
      }
      return next();
    }

    if (address.length < minLength || address.length > maxLength) {
      return res.status(400).json({
        success: false,
        message: `Address must be between ${minLength} and ${maxLength} characters`,
      });
    }

    req.body[fieldName] = validator.escape(validator.trim(address));
    next();
  };
};

/**
 * Validate URL field
 */
export const validateUrl = (fieldName, required = false) => {
  return (req, res, next) => {
    const url = req.body[fieldName];

    if (!url) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required!`,
        });
      }
      return next();
    }

    if (!validator.isURL(url, { protocols: ['http', 'https'] })) {
      return res.status(400).json({
        success: false,
        message: `Invalid URL for ${fieldName}`,
      });
    }

    next();
  };
};

/**
 * Validate date field
 */
export const validateDate = (fieldName = 'date', required = false) => {
  return (req, res, next) => {
    const dateValue = req.body[fieldName];

    if (!dateValue) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required!`,
        });
      }
      return next();
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: `Invalid date format for ${fieldName}`,
      });
    }

    req.body[fieldName] = date.toISOString();
    next();
  };
};

/**
 * Validate number field
 */
export const validateNumber = (
  fieldName,
  minValue = null,
  maxValue = null,
  required = true
) => {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null || value === '') {
      if (required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required!`,
        });
      }
      return next();
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be a valid number!`,
      });
    }

    if (minValue !== null && num < minValue) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be at least ${minValue}`,
      });
    }

    if (maxValue !== null && num > maxValue) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be at most ${maxValue}`,
      });
    }

    req.body[fieldName] = num;
    next();
  };
};

/**
 * Validate enum field
 */
export const validateEnum = (fieldName, allowedValues = [], required = true) => {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (!value) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required!`,
        });
      }
      return next();
    }

    if (!allowedValues.includes(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Sanitize query parameters
 */
export const sanitizeQuery = () => {
  return (req, res, next) => {
    if (req.query) {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = validator.escape(validator.trim(req.query[key]));
        }
      });
    }
    next();
  };
};

/**
 * Sanitize body parameters
 */
export const sanitizeBody = () => {
  return (req, res, next) => {
    if (req.body) {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = validator.escape(validator.trim(req.body[key]));
        }
      });
    }
    next();
  };
};
