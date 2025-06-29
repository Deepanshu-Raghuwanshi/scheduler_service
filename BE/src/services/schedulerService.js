const cron = require("node-cron");
const { JobRepository } = require("../models/Job");
const { getDatabase } = require("../database/connection");

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

/**
 * Job Scheduler Service - Handles job scheduling and execution
 * Follows Single Responsibility Principle and Dependency Injection
 */
class SchedulerService {
  constructor() {
    this.jobRepository = new JobRepository();
    this.db = getDatabase();
    this.activeTasks = new Map(); // Store active cron tasks
    this.executionQueue = new Map(); // Track running executions
    this.isRunning = false;
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
    };
  }

  /**
   * Start the scheduler service
   */
  async start() {
    if (this.isRunning) {
      console.log("Scheduler is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting Job Scheduler Service...");

    try {
      await this.loadAndScheduleJobs();

      // Set up periodic job sync (every 30 seconds)
      this.syncInterval = setInterval(async () => {
        await this.syncJobs();
      }, 30000);

      console.log("Job Scheduler Service started successfully");
    } catch (error) {
      console.error("Failed to start Job Scheduler Service:", error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the scheduler service
   */
  async stop() {
    if (!this.isRunning) {
      console.log("Scheduler is not running");
      return;
    }

    console.log("Stopping Job Scheduler Service...");
    this.isRunning = false;

    // Clear sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Stop all active cron tasks
    for (const [jobId, task] of this.activeTasks) {
      task.destroy();
      console.log(`Stopped job: ${jobId}`);
    }
    this.activeTasks.clear();

    // Wait for running executions to complete (with timeout)
    await this.waitForExecutionsToComplete(30000); // 30 seconds timeout

    console.log("Job Scheduler Service stopped");
  }

  /**
   * Load all active jobs from database and schedule them
   */
  async loadAndScheduleJobs() {
    try {
      const result = await this.jobRepository.findAll({
        isActive: true,
        limit: 1000, // Load up to 1000 active jobs
      });

      console.log(`Loading ${result.jobs.length} active jobs...`);

      for (const job of result.jobs) {
        await this.scheduleJob(job);
      }

      console.log(`Scheduled ${this.activeTasks.size} jobs`);
    } catch (error) {
      console.error("Failed to load and schedule jobs:", error);
      throw error;
    }
  }

  /**
   * Schedule an individual job
   * @param {Job} job - Job instance to schedule
   */
  async scheduleJob(job) {
    try {
      // Validate cron expression
      if (!cron.validate(job.cronExpression)) {
        console.error(
          `Invalid cron expression for job ${job.id}: ${job.cronExpression}`
        );
        return;
      }

      // Remove existing task if any
      if (this.activeTasks.has(job.id)) {
        this.activeTasks.get(job.id).destroy();
      }

      // Create new cron task
      const task = cron.schedule(
        job.cronExpression,
        async () => {
          await this.executeJob(job);
        },
        {
          scheduled: true,
          timezone: process.env.TIMEZONE || "UTC",
        }
      );

      this.activeTasks.set(job.id, task);
      console.log(
        `Scheduled job: ${job.name} (${job.id}) with cron: ${job.cronExpression}`
      );
    } catch (error) {
      console.error(`Failed to schedule job ${job.id}:`, error);
    }
  }

  /**
   * Unschedule a job
   * @param {string} jobId - Job ID to unschedule
   */
  unscheduleJob(jobId) {
    if (this.activeTasks.has(jobId)) {
      this.activeTasks.get(jobId).destroy();
      this.activeTasks.delete(jobId);
      console.log(`Unscheduled job: ${jobId}`);
    }
  }

  /**
   * Execute a job
   * @param {Job} job - Job to execute
   */
  async executeJob(job) {
    const startTime = Date.now();
    let executionId = null;

    // Check if job is already running
    if (this.executionQueue.has(job.id)) {
      console.log(`Job ${job.id} is already running, skipping execution`);
      return;
    }

    console.log(`🔄 Executing job: ${job.name} (${job.id})`);

    // Record execution start
    const execution = {
      jobId: job.id,
      startTime,
      status: "running",
    };

    this.executionQueue.set(job.id, execution);

    try {
      // Create execution record in database and get the UUID
      executionId = await this.createExecutionRecord(job.id, "running");
      execution.id = executionId;

      // Simulate job execution based on job type
      const result = await this.performJobExecution(job);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update execution record
      await this.updateExecutionRecord(
        executionId,
        "completed",
        duration,
        null,
        result
      );

      // Update job statistics
      await this.jobRepository.updateJobStats(job.id, { success: true });

      // Update next run time
      await this.updateNextRunTime(job);

      // Update service statistics
      this.updateServiceStats(duration, true);

      console.log(`Job completed: ${job.name} (${duration}ms)`);
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.error(`Job failed: ${job.name} - ${error.message}`);

      // Update execution record only if we have a valid execution ID
      if (executionId) {
        await this.updateExecutionRecord(
          executionId,
          "failed",
          duration,
          error.message
        );
      }

      // Update job statistics
      await this.jobRepository.updateJobStats(job.id, { success: false });

      // Update service statistics
      this.updateServiceStats(duration, false);

      // Handle retries if configured
      await this.handleJobRetry(job, error);
    } finally {
      // Remove from execution queue
      this.executionQueue.delete(job.id);
    }
  }

  /**
   * Perform actual job execution based on job type
   * @param {Job} job - Job to execute
   * @returns {object} - Execution result
   */
  async performJobExecution(job) {
    // This is where you would implement actual job logic
    // For now, we'll simulate different job types

    const timeout = job.timeoutMs || 30000;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Job execution timeout"));
      }, timeout);

      // Simulate job execution based on type
      setTimeout(() => {
        clearTimeout(timer);

        switch (job.jobType) {
          case "scheduled":
            resolve({
              type: "scheduled",
              message: "Scheduled job completed successfully",
              payload: job.payload,
              executedAt: new Date().toISOString(),
            });
            break;

          case "immediate":
            resolve({
              type: "immediate",
              message: "Immediate job completed successfully",
              payload: job.payload,
              executedAt: new Date().toISOString(),
            });
            break;

          case "recurring":
            resolve({
              type: "recurring",
              message: "Recurring job completed successfully",
              payload: job.payload,
              executedAt: new Date().toISOString(),
            });
            break;

          default:
            resolve({
              type: "default",
              message: "Job completed successfully",
              payload: job.payload,
              executedAt: new Date().toISOString(),
            });
        }
      }, Math.random() * 2000 + 500); // Random execution time between 500ms-2.5s
    });
  }

  /**
   * Handle job retry logic
   * @param {Job} job - Failed job
   * @param {Error} error - Execution error
   */
  async handleJobRetry(job, error) {
    // For now, we'll just log the retry logic
    // In a full implementation, you'd implement exponential backoff
    console.log(`Retry logic for job ${job.id}: ${error.message}`);

    // Could implement retry scheduling here
    if (job.maxRetries > 0) {
      console.log(`Job ${job.id} has ${job.maxRetries} retries remaining`);
    }
  }

  /**
   * Sync jobs from database (handle updates, new jobs, deletions)
   */
  async syncJobs() {
    if (!this.isRunning) return;

    try {
      const result = await this.jobRepository.findAll({
        isActive: true,
        limit: 1000,
      });

      const activeJobIds = new Set(result.jobs.map((job) => job.id));
      const scheduledJobIds = new Set(this.activeTasks.keys());

      // Schedule new jobs
      for (const job of result.jobs) {
        if (!scheduledJobIds.has(job.id)) {
          await this.scheduleJob(job);
        }
      }

      // Unschedule deleted/inactive jobs
      for (const jobId of scheduledJobIds) {
        if (!activeJobIds.has(jobId)) {
          this.unscheduleJob(jobId);
        }
      }
    } catch (error) {
      console.error("Job sync failed:", error);
    }
  }

  /**
   * Create execution record in database
   */
  async createExecutionRecord(jobId, status) {
    const query = `
      INSERT INTO job_executions (job_id, status, started_at)
      VALUES ($1, $2, NOW())
      RETURNING id
    `;

    const result = await this.db.query(query, [jobId, status]);
    return result.rows[0].id;
  }

  /**
   * Update execution record in database
   */
  async updateExecutionRecord(
    executionId,
    status,
    duration,
    errorMessage = null,
    output = null
  ) {
    const query = `
      UPDATE job_executions SET
        status = $2,
        completed_at = NOW(),
        duration_ms = $3,
        error_message = $4,
        output = $5
      WHERE id = $1
    `;

    await this.db.query(query, [
      executionId,
      status,
      duration,
      errorMessage,
      output ? JSON.stringify(output) : null,
    ]);
  }

  /**
   * Update service statistics
   */
  updateServiceStats(duration, success) {
    this.stats.totalExecutions++;

    if (success) {
      this.stats.successfulExecutions++;
    } else {
      this.stats.failedExecutions++;
    }

    // Update average execution time
    this.stats.averageExecutionTime =
      (this.stats.averageExecutionTime * (this.stats.totalExecutions - 1) +
        duration) /
      this.stats.totalExecutions;
  }

  /**
   * Wait for running executions to complete
   */
  async waitForExecutionsToComplete(timeoutMs) {
    const startTime = Date.now();

    while (this.executionQueue.size > 0 && Date.now() - startTime < timeoutMs) {
      console.log(
        `Waiting for ${this.executionQueue.size} executions to complete...`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.executionQueue.size > 0) {
      console.warn(
        `${this.executionQueue.size} executions did not complete within timeout`
      );
    }
  }

  /**
   * Get scheduler statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      activeJobs: this.activeTasks.size,
      runningExecutions: this.executionQueue.size,
      successRate:
        this.stats.totalExecutions > 0
          ? (
              (this.stats.successfulExecutions / this.stats.totalExecutions) *
              100
            ).toFixed(2)
          : 0,
    };
  }

  /**
   * Update next run time for a job after execution
   * @param {Job} job - Job to update
   */
  async updateNextRunTime(job) {
    try {
      const nextRunAt = calculateNextRunTime(job.cronExpression);

      const query = `
        UPDATE jobs SET 
          next_run_at = $2,
          updated_at = NOW()
        WHERE id = $1
      `;

      await this.db.query(query, [job.id, nextRunAt]);
      console.log(
        `Updated next run time for job ${job.id}: ${nextRunAt.toISOString()}`
      );
    } catch (error) {
      console.error(`Failed to update next run time for job ${job.id}:`, error);
    }
  }

  /**
   * Get currently scheduled jobs
   */
  getScheduledJobs() {
    return Array.from(this.activeTasks.keys());
  }
}

// Singleton pattern
let schedulerInstance = null;

const getScheduler = () => {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService();
  }
  return schedulerInstance;
};

module.exports = { SchedulerService, getScheduler };
