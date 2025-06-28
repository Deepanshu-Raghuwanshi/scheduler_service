const Joi = require("joi");

// Cron expression validation (supports 5-field format: minute hour day month dayOfWeek)
const cronPattern =
  /^(\*|[0-5]?[0-9]|\*\/[0-9]+) (\*|[01]?[0-9]|2[0-3]|\*\/[0-9]+) (\*|[12]?[0-9]|3[01]|\*\/[0-9]+) (\*|[01]?[0-9]|1[0-2]|\*\/[0-9]+) (\*|[0-6]|\*\/[0-9]+)$/;

const jobCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    "string.empty": "Job name is required",
    "string.max": "Job name must not exceed 255 characters",
  }),

  description: Joi.string().trim().max(1000).allow("").optional().messages({
    "string.max": "Description must not exceed 1000 characters",
  }),

  cronExpression: Joi.string().pattern(cronPattern).required().messages({
    "string.pattern.base":
      'Invalid cron expression format. Use: "minute hour day month dayOfWeek"',
  }),

  isActive: Joi.boolean().default(true).optional(),

  jobType: Joi.string()
    .valid("scheduled", "immediate", "recurring", "delayed")
    .default("scheduled")
    .optional(),

  payload: Joi.object().default({}).optional().messages({
    "object.base": "Payload must be a valid JSON object",
  }),

  timeoutMs: Joi.number()
    .integer()
    .min(1000)
    .max(300000) // 5 minutes max
    .default(30000)
    .optional()
    .messages({
      "number.min": "Timeout must be at least 1000ms (1 second)",
      "number.max": "Timeout must not exceed 300000ms (5 minutes)",
    }),

  maxRetries: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(3)
    .optional()
    .messages({
      "number.min": "Max retries cannot be negative",
      "number.max": "Max retries cannot exceed 10",
    }),

  retryDelayMs: Joi.number()
    .integer()
    .min(1000)
    .max(60000) // 1 minute max
    .default(5000)
    .optional()
    .messages({
      "number.min": "Retry delay must be at least 1000ms",
      "number.max": "Retry delay must not exceed 60000ms",
    }),

  createdBy: Joi.string().trim().max(255).optional().messages({
    "string.max": "Created by field must not exceed 255 characters",
  }),

  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(10)
    .default([])
    .optional()
    .messages({
      "array.max": "Cannot have more than 10 tags",
      "string.max": "Each tag must not exceed 50 characters",
    }),
});

const jobUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    "string.empty": "Job name cannot be empty",
    "string.max": "Job name must not exceed 255 characters",
  }),

  description: Joi.string().trim().max(1000).allow("").optional().messages({
    "string.max": "Description must not exceed 1000 characters",
  }),

  cronExpression: Joi.string().pattern(cronPattern).optional().messages({
    "string.pattern.base":
      'Invalid cron expression format. Use: "minute hour day month dayOfWeek"',
  }),

  isActive: Joi.boolean().optional(),

  jobType: Joi.string()
    .valid("scheduled", "immediate", "recurring", "delayed")
    .optional(),

  payload: Joi.object().optional().messages({
    "object.base": "Payload must be a valid JSON object",
  }),

  timeoutMs: Joi.number().integer().min(1000).max(300000).optional().messages({
    "number.min": "Timeout must be at least 1000ms (1 second)",
    "number.max": "Timeout must not exceed 300000ms (5 minutes)",
  }),

  maxRetries: Joi.number().integer().min(0).max(10).optional().messages({
    "number.min": "Max retries cannot be negative",
    "number.max": "Max retries cannot exceed 10",
  }),

  retryDelayMs: Joi.number()
    .integer()
    .min(1000)
    .max(60000)
    .optional()
    .messages({
      "number.min": "Retry delay must be at least 1000ms",
      "number.max": "Retry delay must not exceed 60000ms",
    }),

  createdBy: Joi.string().trim().max(255).optional().messages({
    "string.max": "Created by field must not exceed 255 characters",
  }),

  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(10)
    .optional()
    .messages({
      "array.max": "Cannot have more than 10 tags",
      "string.max": "Each tag must not exceed 50 characters",
    }),
});

const jobQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),

  limit: Joi.number().integer().min(1).max(100).default(50).optional(),

  isActive: Joi.boolean().optional(),

  jobType: Joi.string()
    .valid("scheduled", "immediate", "recurring", "delayed")
    .optional(),

  tags: Joi.alternatives()
    .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()))
    .optional(),

  search: Joi.string().trim().max(255).optional().messages({
    "string.max": "Search term must not exceed 255 characters",
  }),
});

const uuidSchema = Joi.string()
  .uuid({ version: "uuidv4" })
  .required()
  .messages({
    "string.guid": "Invalid job ID format",
  });

// Common cron expressions for reference
const commonCronExpressions = {
  "every-minute": "* * * * *",
  "every-5-minutes": "*/5 * * * *",
  "every-hour": "0 * * * *",
  "every-day-midnight": "0 0 * * *",
  "every-week-monday": "0 0 * * 1",
  "every-month-first": "0 0 1 * *",
  "workdays-9am": "0 9 * * 1-5",
  "weekends-10am": "0 10 * * 6,0",
};

module.exports = {
  jobCreateSchema,
  jobUpdateSchema,
  jobQuerySchema,
  uuidSchema,
  commonCronExpressions,
};
