const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Job Scheduler Microservice API",
      version: "1.0.0",
      description: `
        A comprehensive job scheduling microservice that facilitates job scheduling while preserving important job-related information.
        
        ## Features
        - **Job Management**: Create, update, delete, and list jobs
        - **Flexible Scheduling**: Support for cron expressions with various job types
        - **Execution Tracking**: Monitor job executions with detailed history
        - **Performance Optimization**: Built-in caching and rate limiting
        - **Scalability**: Designed to handle 10,000 users, 1,000 services, and 6,000 API requests per minute
        - **Real-time Statistics**: Comprehensive metrics and monitoring
        
        ## Job Types
        - **scheduled**: Regular cron-based scheduling
        - **immediate**: Execute once immediately
        - **recurring**: Recurring executions with custom intervals
        - **delayed**: Execute after a specific delay
        
        ## Common Cron Expressions
        - \`* * * * *\` - Every minute
        - \`0 * * * *\` - Every hour
        - \`0 0 * * *\` - Daily at midnight
        - \`0 0 * * 1\` - Weekly on Monday
        - \`0 0 1 * *\` - Monthly on the 1st
        - \`0 9 * * 1-5\` - Weekdays at 9 AM
        
        ## Rate Limits
        - General endpoints: 100 requests per minute
        - Sensitive operations: 20 requests per minute
        
        ## Error Handling
        All endpoints return consistent error responses with appropriate HTTP status codes and detailed error messages.
      `,
      contact: {
        name: "Job Scheduler API Support",
        email: "support@scheduler.example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.scheduler.example.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Jobs",
        description: "Job management operations",
      },
      {
        name: "Statistics",
        description: "System statistics and monitoring",
      },
      {
        name: "Health",
        description: "Health check and system status",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Bearer token authentication",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API Key authentication",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication information is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false,
                  },
                  error: {
                    type: "string",
                    example: "Unauthorized",
                  },
                  message: {
                    type: "string",
                    example: "Authentication required",
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },
        },
        ValidationError: {
          description: "Request validation failed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false,
                  },
                  error: {
                    type: "string",
                    example: "Validation Error",
                  },
                  details: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: {
                          type: "string",
                          example: "name",
                        },
                        message: {
                          type: "string",
                          example: "Job name is required",
                        },
                        value: {
                          type: "string",
                          example: "",
                        },
                      },
                    },
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },
        },
        RateLimitError: {
          description: "Rate limit exceeded",
          headers: {
            "X-RateLimit-Limit": {
              description: "Request limit per time window",
              schema: {
                type: "integer",
              },
            },
            "X-RateLimit-Remaining": {
              description: "Remaining requests in current window",
              schema: {
                type: "integer",
              },
            },
            "X-RateLimit-Reset": {
              description: "Time when rate limit resets",
              schema: {
                type: "string",
                format: "date-time",
              },
            },
          },
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false,
                  },
                  error: {
                    type: "string",
                    example: "Too Many Requests",
                  },
                  message: {
                    type: "string",
                    example:
                      "Rate limit exceeded. Maximum 100 requests per 60 seconds",
                  },
                  retryAfter: {
                    type: "integer",
                    description: "Seconds to wait before retrying",
                    example: 30,
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: "page",
          in: "query",
          description: "Page number for pagination",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: "limit",
          in: "query",
          description: "Number of items per page",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 50,
          },
        },
        JobIdParam: {
          name: "id",
          in: "path",
          description: "Job UUID",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js", "./src/models/*.js"],
};

const specs = swaggerJsdoc(options);

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { 
    background-color: #2c3e50; 
  }
  .swagger-ui .topbar .download-url-wrapper { 
    display: none; 
  }
  .swagger-ui .info {
    margin: 50px 0;
  }
  .swagger-ui .info .title {
    color: #2c3e50;
  }
  .swagger-ui .scheme-container {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 5px;
    margin: 20px 0;
  }
`;

const swaggerOptions = {
  customCss,
  customSiteTitle: "Job Scheduler API Documentation",
  customfavIcon: "/assets/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
    validatorUrl: null, // Disable validator badge
  },
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions,
};
