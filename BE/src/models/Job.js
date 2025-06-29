const { getDatabase } = require("../database/connection");
const cron = require("node-cron");

/**
 * Calculate next run time for cron expression in IST timezone
 * @param {string} cronExpression - Cron expression
 * @param {Date} fromTime - Base time (defaults to now)
 * @returns {Date} - Next run time in UTC
 */
function calculateNextRunTime(cronExpression, fromTime = new Date()) {
  try {
    // Validate the cron expression first
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Convert current time to IST
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(fromTime.getTime() + istOffset);

    // Parse cron expression parts
    const parts = cronExpression.split(" ");
    const [minute, hour, day, month, dayOfWeek] = parts;

    let nextRun = new Date(istTime);

    // Handle common patterns
    if (cronExpression === "* * * * *") {
      // Every minute
      nextRun.setSeconds(0, 0);
      nextRun.setMinutes(nextRun.getMinutes() + 1);
    } else if (minute.startsWith("*/")) {
      // Every N minutes
      const interval = parseInt(minute.substring(2));
      nextRun.setSeconds(0, 0);
      const currentMinute = nextRun.getMinutes();
      const nextInterval = Math.ceil((currentMinute + 1) / interval) * interval;
      if (nextInterval >= 60) {
        nextRun.setHours(nextRun.getHours() + 1);
        nextRun.setMinutes(nextInterval - 60);
      } else {
        nextRun.setMinutes(nextInterval);
      }
    } else if (minute !== "*" && hour === "*") {
      // Specific minute every hour
      const targetMinute = parseInt(minute);
      nextRun.setMinutes(targetMinute, 0, 0);
      if (istTime.getMinutes() >= targetMinute) {
        nextRun.setHours(nextRun.getHours() + 1);
      }
    } else if (minute !== "*" && hour !== "*" && day === "*" && month === "*") {
      // Daily at specific time
      const targetHour = parseInt(hour);
      const targetMinute = parseInt(minute);
      nextRun.setHours(targetHour, targetMinute, 0, 0);
      if (istTime >= nextRun) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else {
      // For complex expressions, use a simple fallback
      // Add 1 hour as a safe default
      nextRun.setHours(nextRun.getHours() + 1);
      nextRun.setMinutes(0, 0, 0);
    }

    // Convert IST time back to UTC for storage
    return new Date(nextRun.getTime() - istOffset);
  } catch (error) {
    console.error(
      `Error calculating next run time for cron expression "${cronExpression}":`,
      error.message
    );

    // Fallback: add 1 hour to current time if cron parsing fails
    const fallbackTime = new Date(fromTime.getTime() + 60 * 60 * 1000);
    console.warn(`Using fallback time: ${fallbackTime.toISOString()}`);
    return fallbackTime;
  }
}

class Job {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.cronExpression = data.cron_expression || data.cronExpression;
    this.isActive =
      data.is_active !== undefined ? data.is_active : data.isActive;
    this.jobType = data.job_type || data.jobType || "scheduled";
    this.payload = data.payload || {};
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
    this.lastRunAt = data.last_run_at || data.lastRunAt;
    this.nextRunAt = data.next_run_at || data.nextRunAt;
    this.totalRuns = data.total_runs || data.totalRuns || 0;
    this.successfulRuns = data.successful_runs || data.successfulRuns || 0;
    this.failedRuns = data.failed_runs || data.failedRuns || 0;
    this.timeoutMs = data.timeout_ms || data.timeoutMs || 30000;
    this.maxRetries = data.max_retries || data.maxRetries || 3;
    this.retryDelayMs = data.retry_delay_ms || data.retryDelayMs || 5000;
    this.createdBy = data.created_by || data.createdBy;
    this.tags = data.tags || [];
  }

  // Convert to database format
  toDatabase() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      cron_expression: this.cronExpression,
      is_active: this.isActive,
      job_type: this.jobType,
      payload: JSON.stringify(this.payload),
      timeout_ms: this.timeoutMs,
      max_retries: this.maxRetries,
      retry_delay_ms: this.retryDelayMs,
      created_by: this.createdBy,
      tags: this.tags,
    };
  }

  // Convert to API response format
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      cronExpression: this.cronExpression,
      isActive: this.isActive,
      jobType: this.jobType,
      payload: this.payload,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
      statistics: {
        totalRuns: this.totalRuns,
        successfulRuns: this.successfulRuns,
        failedRuns: this.failedRuns,
        successRate:
          this.totalRuns > 0
            ? ((this.successfulRuns / this.totalRuns) * 100).toFixed(2)
            : 0,
      },
      configuration: {
        timeoutMs: this.timeoutMs,
        maxRetries: this.maxRetries,
        retryDelayMs: this.retryDelayMs,
      },
      createdBy: this.createdBy,
      tags: this.tags,
    };
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("Name is required");
    }

    if (!this.cronExpression || this.cronExpression.trim().length === 0) {
      errors.push("Cron expression is required");
    }

    if (this.timeoutMs && (this.timeoutMs < 1000 || this.timeoutMs > 300000)) {
      errors.push("Timeout must be between 1000ms and 300000ms");
    }

    if (this.maxRetries && (this.maxRetries < 0 || this.maxRetries > 10)) {
      errors.push("Max retries must be between 0 and 10");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

class JobRepository {
  constructor() {
    this.db = getDatabase();
  }

  async findAll(options = {}) {
    const { page = 1, limit = 50, isActive, jobType, tags, search } = options;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Build dynamic WHERE clause
    if (isActive !== undefined) {
      paramCount++;
      whereConditions.push(`is_active = $${paramCount}`);
      queryParams.push(isActive);
    }

    if (jobType) {
      paramCount++;
      whereConditions.push(`job_type = $${paramCount}`);
      queryParams.push(jobType);
    }

    if (tags && tags.length > 0) {
      paramCount++;
      whereConditions.push(`tags && $${paramCount}`);
      queryParams.push(tags);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`name ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const query = `
      SELECT * FROM jobs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const result = await this.db.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM jobs ${whereClause}`;
    const countResult = await this.db.query(
      countQuery,
      queryParams.slice(0, -2)
    );

    return {
      jobs: result.rows.map((row) => new Job(row)),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  async findById(id) {
    const query = "SELECT * FROM jobs WHERE id = $1";
    const result = await this.db.query(query, [id]);

    return result.rows.length > 0 ? new Job(result.rows[0]) : null;
  }

  async create(jobData) {
    const job = new Job(jobData);
    const validation = job.validate();

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    const dbData = job.toDatabase();

    // Calculate next run time in IST
    const nextRunAt = calculateNextRunTime(job.cronExpression);

    const query = `
      INSERT INTO jobs (
        name, description, cron_expression, is_active, job_type,
        payload, timeout_ms, max_retries, retry_delay_ms, created_by, tags, next_run_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      dbData.name,
      dbData.description,
      dbData.cron_expression,
      dbData.is_active,
      dbData.job_type,
      dbData.payload,
      dbData.timeout_ms,
      dbData.max_retries,
      dbData.retry_delay_ms,
      dbData.created_by,
      dbData.tags,
      nextRunAt,
    ];

    const result = await this.db.query(query, values);
    return new Job(result.rows[0]);
  }

  async update(id, updateData) {
    const existingJob = await this.findById(id);
    if (!existingJob) {
      return null;
    }

    // Merge existing data with updates
    const updatedJob = new Job({ ...existingJob, ...updateData });
    const validation = updatedJob.validate();

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    const dbData = updatedJob.toDatabase();

    // Recalculate next run time if cron expression changed
    let nextRunAt = existingJob.nextRunAt;
    if (existingJob.cronExpression !== updatedJob.cronExpression) {
      nextRunAt = calculateNextRunTime(updatedJob.cronExpression);
    }

    const query = `
      UPDATE jobs SET
        name = $2,
        description = $3,
        cron_expression = $4,
        is_active = $5,
        job_type = $6,
        payload = $7,
        timeout_ms = $8,
        max_retries = $9,
        retry_delay_ms = $10,
        created_by = $11,
        tags = $12,
        next_run_at = $13,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      dbData.name,
      dbData.description,
      dbData.cron_expression,
      dbData.is_active,
      dbData.job_type,
      dbData.payload,
      dbData.timeout_ms,
      dbData.max_retries,
      dbData.retry_delay_ms,
      dbData.created_by,
      dbData.tags,
      nextRunAt,
    ];

    const result = await this.db.query(query, values);
    return new Job(result.rows[0]);
  }

  async delete(id) {
    const query = "DELETE FROM jobs WHERE id = $1 RETURNING *";
    const result = await this.db.query(query, [id]);

    return result.rows.length > 0 ? new Job(result.rows[0]) : null;
  }

  async updateJobStats(id, stats) {
    const query = `
      UPDATE jobs SET
        last_run_at = $2,
        total_runs = total_runs + 1,
        successful_runs = successful_runs + $3,
        failed_runs = failed_runs + $4,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      new Date(),
      stats.success ? 1 : 0,
      stats.success ? 0 : 1,
    ];

    const result = await this.db.query(query, values);
    return result.rows.length > 0 ? new Job(result.rows[0]) : null;
  }

  async getActiveJobs() {
    const query = `
      SELECT * FROM jobs 
      WHERE is_active = true 
      AND (next_run_at IS NULL OR next_run_at <= NOW())
      ORDER BY next_run_at ASC
    `;

    const result = await this.db.query(query);
    return result.rows.map((row) => new Job(row));
  }
}

module.exports = { Job, JobRepository, calculateNextRunTime };
