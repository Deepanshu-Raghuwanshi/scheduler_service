const { getDatabase } = require("../database/connection");

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

    const query = `
      INSERT INTO jobs (
        name, description, cron_expression, is_active, job_type,
        payload, timeout_ms, max_retries, retry_delay_ms, created_by, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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

module.exports = { Job, JobRepository };
