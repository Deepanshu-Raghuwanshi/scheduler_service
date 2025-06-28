const compression = require("compression");
const helmet = require("helmet");

/**
 * Rate limiting middleware (simple in-memory implementation)
 * For production, use Redis-based rate limiting
 */
class RateLimiter {
  constructor(windowMs = 60000, max = 100) {
    this.windowMs = windowMs;
    this.max = max;
    this.clients = new Map();

    // Cleanup expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  middleware() {
    return (req, res, next) => {
      const clientId = this.getClientId(req);
      const now = Date.now();
      const windowStart = now - this.windowMs;

      if (!this.clients.has(clientId)) {
        this.clients.set(clientId, []);
      }

      const requests = this.clients.get(clientId);

      // Remove old requests outside the window
      const recentRequests = requests.filter(
        (timestamp) => timestamp > windowStart
      );
      this.clients.set(clientId, recentRequests);

      // Check if limit exceeded
      if (recentRequests.length >= this.max) {
        return res.status(429).json({
          success: false,
          error: "Too Many Requests",
          message: `Rate limit exceeded. Maximum ${this.max} requests per ${
            this.windowMs / 1000
          } seconds`,
          retryAfter: Math.ceil(
            (recentRequests[0] + this.windowMs - now) / 1000
          ),
          timestamp: new Date().toISOString(),
        });
      }

      // Add current request
      recentRequests.push(now);

      // Add rate limit headers
      res.set({
        "X-RateLimit-Limit": this.max,
        "X-RateLimit-Remaining": Math.max(0, this.max - recentRequests.length),
        "X-RateLimit-Reset": new Date(
          windowStart + this.windowMs
        ).toISOString(),
      });

      next();
    };
  }

  getClientId(req) {
    // Use IP address as client identifier
    return req.ip || req.connection.remoteAddress || "unknown";
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [clientId, requests] of this.clients.entries()) {
      const recentRequests = requests.filter(
        (timestamp) => timestamp > now - this.windowMs
      );

      if (recentRequests.length === 0) {
        this.clients.delete(clientId);
        cleaned++;
      } else {
        this.clients.set(clientId, recentRequests);
      }
    }

    if (cleaned > 0) {
      console.log(`Rate limiter cleanup: removed ${cleaned} expired clients`);
    }
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      windowMs: this.windowMs,
      maxRequests: this.max,
    };
  }
}

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`
  );

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.url} - ${
        res.statusCode
      } - ${duration}ms`
    );

    // Log slow requests
    if (duration > 1000) {
      console.warn(
        `Slow request detected: ${req.method} ${req.url} took ${duration}ms`
      );
    }

    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
  console.error(`Error in ${req.method} ${req.url}:`, {
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  next(err);
};

/**
 * Global error handler
 */
const globalErrorHandler = (err, req, res, next) => {
  // Default error response
  let statusCode = 500;
  let errorType = "Internal Server Error";
  let message = "An unexpected error occurred";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorType = "Validation Error";
    message = err.message;
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    errorType = "Unauthorized";
    message = "Authentication required";
  } else if (err.code === "ECONNREFUSED") {
    statusCode = 503;
    errorType = "Service Unavailable";
    message = "Database connection failed";
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Internal server error";
  }

  res.status(statusCode).json({
    success: false,
    error: errorType,
    message: message,
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
      details: err,
    }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Health check middleware
 */
const healthCheck = (req, res, next) => {
  if (req.path === "/health" || req.path === "/api/health") {
    return res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || "1.0.0",
    });
  }
  next();
};

/**
 * Request timeout middleware
 */
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: "Request Timeout",
          message: `Request timed out after ${timeoutMs}ms`,
          timestamp: new Date().toISOString(),
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    const originalEnd = res.end;
    res.end = function (...args) {
      clearTimeout(timeout);
      originalEnd.apply(res, args);
    };

    next();
  };
};

/**
 * Security headers middleware (using helmet)
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Compression middleware
 */
const compressionMiddleware = compression({
  level: 6,
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers["x-no-compression"]) {
      return false;
    }

    // Use compression for JSON and text responses
    return compression.filter(req, res);
  },
});

// Create rate limiter instances for different endpoints
const generalRateLimit = new RateLimiter(60000, 100); // 100 requests per minute
const strictRateLimit = new RateLimiter(60000, 20); // 20 requests per minute for sensitive endpoints

module.exports = {
  RateLimiter,
  requestLogger,
  errorLogger,
  globalErrorHandler,
  healthCheck,
  requestTimeout,
  securityHeaders,
  compressionMiddleware,
  generalRateLimit: generalRateLimit.middleware(),
  strictRateLimit: strictRateLimit.middleware(),
  getRateLimitStats: () => ({
    general: generalRateLimit.getStats(),
    strict: strictRateLimit.getStats(),
  }),
};
