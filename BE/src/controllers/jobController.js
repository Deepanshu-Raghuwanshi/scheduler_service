const { JobRepository } = require("../models/Job");
const { getScheduler } = require("../services/schedulerService");
const { getCache } = require("../services/cacheService");

/**
 * Job Controller - Handles HTTP requests for job management
 * Follows Single Responsibility and Dependency Inversion principles
 */
class JobController {
  constructor() {
    this.jobRepository = new JobRepository();
    this.scheduler = getScheduler();
    this.cache = getCache();
  }

  /**
   * GET /jobs - List all jobs with filtering and pagination
   */
  async getAllJobs(req, res) {
    try {
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 50,
        isActive: req.query.isActive,
        jobType: req.query.jobType,
        tags: req.query.tags,
        search: req.query.search,
      };

      // Check if client wants to bypass cache for fresh data
      const bypassCache = req.query.fresh === "true";

      // Create cache key based on query parameters (excluding fresh parameter)
      const cacheKey = `jobs:${JSON.stringify(options)}`;

      // Try to get from cache first (unless bypassing cache)
      let result = bypassCache ? null : this.cache.get(cacheKey);

      if (!result) {
        result = await this.jobRepository.findAll(options);

        // Cache for 2 minutes (reduced from 5 minutes for more frequent updates)
        this.cache.set(cacheKey, result, 2 * 60 * 1000);
      }

      // Always fetch fresh execution times for active jobs to avoid stale data
      const jobsWithFreshTimes = await Promise.all(
        result.jobs.map(async (job) => {
          if (job.isActive) {
            // Get fresh execution times from database
            const freshJob = await this.jobRepository.findById(job.id);
            if (freshJob) {
              // Update the cached job with fresh execution times
              job.lastRunAt = freshJob.lastRunAt;
              job.nextRunAt = freshJob.nextRunAt;
              job.statistics = freshJob.statistics;
            }
          }
          return job.toJSON();
        })
      );

      res.json({
        success: true,
        data: {
          jobs: jobsWithFreshTimes,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch jobs",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /jobs/:id - Get specific job by ID
   */
  async getJobById(req, res) {
    try {
      const { id } = req.params;

      // Try cache first
      const cacheKey = `job:${id}`;
      let job = this.cache.get(cacheKey);

      if (!job) {
        job = await this.jobRepository.findById(id);

        if (job) {
          // Cache for 10 minutes
          this.cache.set(cacheKey, job, 10 * 60 * 1000);
        }
      }

      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: `Job with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      // Get job execution history
      const executionHistory = await this.getJobExecutionHistory(id);

      res.json({
        success: true,
        data: {
          job: job.toJSON(),
          executionHistory,
          isScheduled: this.scheduler.getScheduledJobs().includes(id),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch job",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /jobs - Create new job
   */
  async createJob(req, res) {
    try {
      const jobData = req.body;

      // Create job in database
      const job = await this.jobRepository.create(jobData);

      // Schedule the job if it's active
      if (job.isActive) {
        await this.scheduler.scheduleJob(job);
      }

      // Invalidate cache
      this.invalidateJobsCache();

      res.status(201).json({
        success: true,
        data: job.toJSON(),
        message: "Job created successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error creating job:", error);

      if (error.message.includes("Validation failed")) {
        return res.status(400).json({
          success: false,
          error: "Validation Error",
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to create job",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /jobs/:id - Update existing job
   */
  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedJob = await this.jobRepository.update(id, updateData);

      if (!updatedJob) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: `Job with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      // Update scheduler
      if (updatedJob.isActive) {
        await this.scheduler.scheduleJob(updatedJob);
      } else {
        this.scheduler.unscheduleJob(id);
      }

      // Invalidate cache
      this.invalidateJobCache(id);
      this.invalidateJobsCache();

      res.json({
        success: true,
        data: updatedJob.toJSON(),
        message: "Job updated successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating job:", error);

      if (error.message.includes("Validation failed")) {
        return res.status(400).json({
          success: false,
          error: "Validation Error",
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to update job",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /jobs/:id - Delete job
   */
  async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const deletedJob = await this.jobRepository.delete(id);

      if (!deletedJob) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: `Job with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      // Remove from scheduler
      this.scheduler.unscheduleJob(id);

      // Invalidate cache
      this.invalidateJobCache(id);
      this.invalidateJobsCache();

      res.json({
        success: true,
        data: deletedJob.toJSON(),
        message: "Job deleted successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to delete job",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /jobs/:id/trigger - Manually trigger job execution
   */
  async triggerJob(req, res) {
    try {
      const { id } = req.params;

      const job = await this.jobRepository.findById(id);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: `Job with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      // Trigger job execution (asynchronously)
      setImmediate(async () => {
        try {
          await this.scheduler.executeJob(job);
        } catch (error) {
          console.error(`Manual job trigger failed for ${id}:`, error);
        }
      });

      res.json({
        success: true,
        message: "Job execution triggered successfully",
        data: {
          jobId: id,
          jobName: job.name,
          triggeredAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error triggering job:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to trigger job",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /jobs/:id/executions - Get job execution history
   */
  async getJobExecutions(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const executionHistory = await this.getJobExecutionHistory(id, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: executionHistory,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching job executions:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch job executions",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /jobs/stats - Get job statistics
   */
  async getJobStats(req, res) {
    try {
      const schedulerStats = this.scheduler.getStats();
      const cacheStats = this.cache.getStats();

      // Get database stats
      const dbStats = await this.getDatabaseStats();

      res.json({
        success: true,
        data: {
          scheduler: schedulerStats,
          cache: cacheStats,
          database: dbStats,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching job stats:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch job statistics",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Helper method to get job execution history
   */
  async getJobExecutionHistory(jobId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT id, status, started_at, completed_at, duration_ms, error_message, retry_count
      FROM job_executions
      WHERE job_id = $1
      ORDER BY started_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) FROM job_executions WHERE job_id = $1
    `;

    const [executions, count] = await Promise.all([
      this.jobRepository.db.query(query, [jobId, limit, offset]),
      this.jobRepository.db.query(countQuery, [jobId]),
    ]);

    return {
      executions: executions.rows.map((row) => ({
        id: row.id,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        durationMs: row.duration_ms,
        errorMessage: row.error_message,
        retryCount: row.retry_count,
      })),
      pagination: {
        page,
        limit,
        total: parseInt(count.rows[0].count),
        totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
      },
    };
  }

  /**
   * Helper method to get database statistics
   */
  async getDatabaseStats() {
    const queries = {
      totalJobs: "SELECT COUNT(*) FROM jobs",
      activeJobs: "SELECT COUNT(*) FROM jobs WHERE is_active = true",
      totalExecutions: "SELECT COUNT(*) FROM job_executions",
      recentExecutions: `
        SELECT COUNT(*) FROM job_executions 
        WHERE started_at >= NOW() - INTERVAL '24 hours'
      `,
      jobsByType: `
        SELECT job_type, COUNT(*) as count 
        FROM jobs 
        GROUP BY job_type
      `,
    };

    const results = await Promise.all(
      Object.entries(queries).map(async ([key, query]) => {
        const result = await this.jobRepository.db.query(query);
        return [key, result.rows];
      })
    );

    const stats = Object.fromEntries(results);

    return {
      totalJobs: parseInt(stats.totalJobs[0].count),
      activeJobs: parseInt(stats.activeJobs[0].count),
      totalExecutions: parseInt(stats.totalExecutions[0].count),
      recentExecutions: parseInt(stats.recentExecutions[0].count),
      jobsByType: stats.jobsByType.reduce((acc, row) => {
        acc[row.job_type] = parseInt(row.count);
        return acc;
      }, {}),
    };
  }

  /**
   * Cache invalidation helpers
   */
  invalidateJobCache(jobId) {
    this.cache.delete(`job:${jobId}`);
  }

  invalidateJobsCache() {
    // Remove all jobs list cache entries
    const keys = this.cache.keys();
    keys.forEach((key) => {
      if (key.startsWith("jobs:")) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * POST /jobs/validate-cron - Validate cron expression
   */
  async validateCronExpression(req, res) {
    try {
      const { cronExpression } = req.body;

      if (!cronExpression) {
        return res.status(400).json({
          success: false,
          error: "Cron expression is required",
          timestamp: new Date().toISOString(),
        });
      }

      const cron = require("node-cron");

      // Validate with node-cron
      const isValidFormat = cron.validate(cronExpression);

      if (!isValidFormat) {
        return res.status(400).json({
          success: false,
          error: "Invalid cron expression format",
          details: {
            expression: cronExpression,
            message:
              "Please use a valid 5-field cron expression (minute hour day month dayOfWeek)",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Calculate next run times using our custom function
      try {
        // Import the calculateNextRunTime function
        const { calculateNextRunTime } = require("../models/Job");
        const nextRuns = [];
        let currentTime = new Date();

        for (let i = 0; i < 5; i++) {
          const nextRun = calculateNextRunTime(cronExpression, currentTime);
          nextRuns.push(nextRun);
          currentTime = new Date(nextRun.getTime() + 1000); // Add 1 second to get the next occurrence
        }

        return res.json({
          success: true,
          data: {
            expression: cronExpression,
            isValid: true,
            nextRuns: nextRuns,
            timezone: "Asia/Kolkata (IST)",
            message: "Valid cron expression",
          },
          timestamp: new Date().toISOString(),
        });
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: "Invalid cron expression",
          details: {
            expression: cronExpression,
            message: parseError.message,
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Cron validation error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error during cron validation",
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = JobController;
