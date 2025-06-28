const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import custom modules
const { getDatabase } = require("./src/database/connection");
const { getScheduler } = require("./src/services/schedulerService");
const jobRoutes = require("./src/routes/jobRoutes");
const { specs, swaggerUi, swaggerOptions } = require("./src/utils/swagger");
const {
  requestLogger,
  errorLogger,
  globalErrorHandler,
  healthCheck,
  requestTimeout,
  securityHeaders,
  compressionMiddleware,
  generalRateLimit,
  strictRateLimit,
  getRateLimitStats,
} = require("./src/middleware/performance");
const { handleValidationError } = require("./src/middleware/validation");

const app = express();
const port = process.env.PORT || 3000;

// Security and performance middleware
app.use(securityHeaders);
app.use(compressionMiddleware);
app.use(requestTimeout(30000)); // 30 seconds timeout
app.use(requestLogger);

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check middleware (before rate limiting)
app.use(healthCheck);

// Rate limiting
app.use("/api/jobs/:id/trigger", strictRateLimit);
app.use("/api/jobs", generalRateLimit); // General rate limit for job endpoints
app.use("/api", generalRateLimit); // General rate limit for all API endpoints

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// API routes
app.use("/api/jobs", jobRoutes);

// Root endpoint with API information
app.get("/", async (req, res) => {
  try {
    const db = getDatabase();
    const healthCheck = await db.healthCheck();
    const scheduler = getScheduler();

    res.json({
      name: "Job Scheduler Microservice",
      version: "1.0.0",
      status: "operational",
      timestamp: new Date().toISOString(),
      services: {
        database: healthCheck.healthy ? "connected" : "disconnected",
        scheduler: scheduler.getStats().isRunning ? "running" : "stopped",
      },
      api: {
        documentation: "/api-docs",
        version: "v1",
        endpoints: {
          jobs: "/api/jobs",
          health: "/health",
          stats: "/api/jobs/stats",
        },
      },
      statistics: scheduler.getStats(),
    });
  } catch (err) {
    console.error("Root endpoint error:", err);
    res.status(503).json({
      name: "Job Scheduler Microservice",
      status: "error",
      error: "Service temporarily unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});

// Enhanced health check endpoint
app.get("/health", async (req, res) => {
  try {
    const db = getDatabase();
    const healthCheck = await db.healthCheck();
    const scheduler = getScheduler();
    const schedulerStats = scheduler.getStats();
    const rateLimitStats = getRateLimitStats();

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      services: {
        database: {
          status: healthCheck.healthy ? "up" : "down",
          latency: healthCheck.latency || null,
          error: healthCheck.error || null,
        },
        scheduler: {
          status: schedulerStats.isRunning ? "running" : "stopped",
          activeJobs: schedulerStats.activeJobs,
          runningExecutions: schedulerStats.runningExecutions,
        },
        rateLimiter: rateLimitStats,
      },
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
    };

    // Set status based on critical services
    if (!healthCheck.healthy || !schedulerStats.isRunning) {
      health.status = "degraded";
      res.status(503);
    }

    res.json(health);
  } catch (err) {
    console.error("Health check error:", err);
    res.status(503).json({
      status: "unhealthy",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// System statistics endpoint
app.get("/api/stats/system", generalRateLimit, async (req, res) => {
  try {
    const scheduler = getScheduler();
    const rateLimitStats = getRateLimitStats();

    res.json({
      success: true,
      data: {
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || "development",
        },
        scheduler: scheduler.getStats(),
        rateLimiter: rateLimitStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("System stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve system statistics",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    suggestions: [
      "Check the API documentation at /api-docs",
      "Verify the HTTP method is correct",
      "Ensure the endpoint path is accurate",
    ],
  });
});

// Error handling middleware
app.use(handleValidationError);
app.use(errorLogger);
app.use(globalErrorHandler);

// Initialize services and start server
async function startServer() {
  try {
    console.log("Starting Job Scheduler Microservice...");

    // Initialize database
    const db = getDatabase();
    await db.initialize();

    // Start scheduler service
    const scheduler = getScheduler();
    await scheduler.start();

    // Start HTTP server
    const server = app.listen(port, () => {
      console.log("Job Scheduler Microservice started successfully");
      console.log(
        `API Documentation available at: http://localhost:${port}/api-docs`
      );
      console.log(`Health monitoring at: http://localhost:${port}/health`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n Received ${signal}, initiating graceful shutdown...`);

      // Stop accepting new requests
      server.close(async () => {
        console.log("📝 HTTP server closed");

        try {
          // Stop scheduler
          await scheduler.stop();
          console.log("⏹Scheduler stopped");

          // Close database connections
          await db.close();
          console.log("Database connections closed");

          console.log("Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
