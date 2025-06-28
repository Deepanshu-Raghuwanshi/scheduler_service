import apiClient from "../config/api";

/**
 * Job Service - Handles all job-related API operations
 */
class JobService {
  /**
   * Get all jobs with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 50)
   * @param {boolean} params.isActive - Filter by active status
   * @param {string} params.jobType - Filter by job type
   * @param {string} params.tags - Filter by tags (comma-separated)
   * @param {string} params.search - Search in job names
   * @returns {Promise<Object>} Jobs list with pagination
   */
  async getAllJobs(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Add parameters if they exist
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });

      const response = await apiClient.get(`/jobs?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleApiError("Failed to fetch jobs", error);
    }
  }

  /**
   * Get job by ID with execution history
   * @param {string} jobId - Job UUID
   * @returns {Promise<Object>} Job details with execution history
   */
  async getJobById(jobId) {
    try {
      const response = await apiClient.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw this.handleApiError(`Failed to fetch job ${jobId}`, error);
    }
  }

  /**
   * Create a new job
   * @param {Object} jobData - Job creation data
   * @param {string} jobData.name - Job name (required)
   * @param {string} jobData.cronExpression - Cron expression (required)
   * @param {string} jobData.description - Job description
   * @param {boolean} jobData.isActive - Whether job is active (default: true)
   * @param {string} jobData.jobType - Job type (scheduled, immediate, recurring, delayed)
   * @param {Object} jobData.payload - Job configuration payload
   * @param {number} jobData.timeoutMs - Execution timeout in ms
   * @param {number} jobData.maxRetries - Maximum retry attempts
   * @param {number} jobData.retryDelayMs - Delay between retries in ms
   * @param {string} jobData.createdBy - Creator username
   * @param {Array<string>} jobData.tags - Job tags
   * @returns {Promise<Object>} Created job data
   */
  async createJob(jobData) {
    try {
      const response = await apiClient.post("/jobs", jobData);
      return response.data;
    } catch (error) {
      throw this.handleApiError("Failed to create job", error);
    }
  }

  /**
   * Update existing job
   * @param {string} jobId - Job UUID
   * @param {Object} updates - Job update data (partial)
   * @returns {Promise<Object>} Updated job data
   */
  async updateJob(jobId, updates) {
    try {
      const response = await apiClient.put(`/jobs/${jobId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleApiError(`Failed to update job ${jobId}`, error);
    }
  }

  /**
   * Delete job
   * @param {string} jobId - Job UUID
   * @returns {Promise<Object>} Deleted job data
   */
  async deleteJob(jobId) {
    try {
      const response = await apiClient.delete(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw this.handleApiError(`Failed to delete job ${jobId}`, error);
    }
  }

  /**
   * Manually trigger job execution
   * @param {string} jobId - Job UUID
   * @returns {Promise<Object>} Trigger response
   */
  async triggerJob(jobId) {
    try {
      const response = await apiClient.post(`/jobs/${jobId}/trigger`);
      return response.data;
    } catch (error) {
      throw this.handleApiError(`Failed to trigger job ${jobId}`, error);
    }
  }

  /**
   * Get job execution history
   * @param {string} jobId - Job UUID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @returns {Promise<Object>} Execution history with pagination
   */
  async getJobExecutions(jobId, params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Add parameters if they exist
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });

      const response = await apiClient.get(
        `/jobs/${jobId}/executions?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(
        `Failed to fetch executions for job ${jobId}`,
        error
      );
    }
  }

  /**
   * Get comprehensive job statistics
   * @returns {Promise<Object>} Job statistics including scheduler, cache, and database stats
   */
  async getJobStats() {
    try {
      const response = await apiClient.get("/jobs/stats");
      return response.data;
    } catch (error) {
      throw this.handleApiError("Failed to fetch job statistics", error);
    }
  }

  /**
   * Toggle job active status
   * @param {string} jobId - Job UUID
   * @param {boolean} isActive - New active status
   * @returns {Promise<Object>} Updated job data
   */
  async toggleJobStatus(jobId, isActive) {
    return this.updateJob(jobId, { isActive });
  }

  /**
   * Bulk operations
   * @param {Array<string>} jobIds - Array of job UUIDs
   * @param {string} operation - Operation type ('delete', 'activate', 'deactivate')
   * @returns {Promise<Array>} Results of all operations
   */
  async bulkOperation(jobIds, operation) {
    try {
      const promises = jobIds.map((jobId) => {
        switch (operation) {
          case "delete":
            return this.deleteJob(jobId);
          case "activate":
            return this.toggleJobStatus(jobId, true);
          case "deactivate":
            return this.toggleJobStatus(jobId, false);
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      });

      const results = await Promise.allSettled(promises);

      return results.map((result, index) => ({
        jobId: jobIds[index],
        success: result.status === "fulfilled",
        data: result.status === "fulfilled" ? result.value : null,
        error: result.status === "rejected" ? result.reason : null,
      }));
    } catch (error) {
      throw this.handleApiError(`Failed to perform bulk ${operation}`, error);
    }
  }

  /**
   * Validate cron expression
   * @param {string} cronExpression - Cron expression to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateCronExpression(cronExpression) {
    try {
      // For now, we'll do basic client-side validation
      // In a real implementation, you might want to send this to the backend
      const cronRegex =
        /^(\*|[0-5]?[0-9]|\*\/[0-9]+) (\*|[01]?[0-9]|2[0-3]|\*\/[0-9]+) (\*|[12]?[0-9]|3[01]|\*\/[0-9]+) (\*|[01]?[0-9]|1[0-2]|\*\/[0-9]+) (\*|[0-6]|\*\/[0-9]+)$/;

      const isValid = cronRegex.test(cronExpression);
      return {
        success: true,
        data: {
          isValid,
          expression: cronExpression,
          message: isValid
            ? "Valid cron expression"
            : "Invalid cron expression format",
        },
      };
    } catch (error) {
      throw this.handleApiError("Failed to validate cron expression", error);
    }
  }

  /**
   * Handle API errors consistently
   * @private
   */
  handleApiError(message, error) {
    console.error(`JobService Error: ${message}`, error);

    return {
      message,
      originalMessage: error.message || "Unknown error",
      status: error.status || 0,
      details: error.details || [],
      timestamp: error.timestamp || new Date().toISOString(),
    };
  }
}

// Export singleton instance
export default new JobService();
