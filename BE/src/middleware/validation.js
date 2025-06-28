const {
  jobCreateSchema,
  jobUpdateSchema,
  jobQuerySchema,
  uuidSchema,
} = require("../validators/jobValidators");

/**
 * Generic validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Where to get data from ('body', 'query', 'params')
 */
const validateRequest = (schema, source = "body") => {
  return (req, res, next) => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert strings to appropriate types
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context.value,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation Error",
        details: errorDetails,
        timestamp: new Date().toISOString(),
      });
    }

    // Replace the original data with validated and sanitized data
    req[source] = value;
    next();
  };
};

// Specific validation middlewares
const validateJobCreate = validateRequest(jobCreateSchema, "body");
const validateJobUpdate = validateRequest(jobUpdateSchema, "body");
const validateJobQuery = validateRequest(jobQuerySchema, "query");
// Special middleware for validating job ID parameter
const validateJobId = (req, res, next) => {
  const { error, value } = uuidSchema.validate(req.params.id);

  if (error) {
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      message: "Invalid job ID format",
      details: [
        {
          field: "id",
          message: error.message,
          value: req.params.id,
        },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  req.params.id = value;
  next();
};

// Error handling middleware for validation errors
const handleValidationError = (error, req, res, next) => {
  if (error.isJoi) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
      value: detail.context.value,
    }));

    return res.status(400).json({
      success: false,
      error: "Validation Error",
      details: errorDetails,
      timestamp: new Date().toISOString(),
    });
  }
  next(error);
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Convert string arrays in query params
  if (req.query.tags && typeof req.query.tags === "string") {
    req.query.tags = req.query.tags.split(",").map((tag) => tag.trim());
  }

  // Convert string booleans
  if (req.query.isActive) {
    req.query.isActive = req.query.isActive === "true";
  }

  // Convert numeric strings
  ["page", "limit"].forEach((field) => {
    if (req.query[field] && typeof req.query[field] === "string") {
      const num = parseInt(req.query[field], 10);
      if (!isNaN(num)) {
        req.query[field] = num;
      }
    }
  });

  next();
};

module.exports = {
  validateRequest,
  validateJobCreate,
  validateJobUpdate,
  validateJobQuery,
  validateJobId,
  handleValidationError,
  sanitizeRequest,
};
