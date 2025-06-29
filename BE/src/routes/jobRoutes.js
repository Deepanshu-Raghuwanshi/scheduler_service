const express = require("express");
const JobController = require("../controllers/jobController");
const {
  validateJobCreate,
  validateJobUpdate,
  validateJobQuery,
  validateJobId,
  sanitizeRequest,
} = require("../middleware/validation");

const router = express.Router();
const jobController = new JobController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - name
 *         - cronExpression
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the job
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Name of the job
 *           example: "Daily Data Backup"
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Optional job description
 *           example: "Backup user data every day at midnight"
 *         cronExpression:
 *           type: string
 *           pattern: '^(\*|[0-5]?[0-9]|\*\/[0-9]+) (\*|[01]?[0-9]|2[0-3]|\*\/[0-9]+) (\*|[12]?[0-9]|3[01]|\*\/[0-9]+) (\*|[01]?[0-9]|1[0-2]|\*\/[0-9]+) (\*|[0-6]|\*\/[0-9]+)$'
 *           description: Cron expression for scheduling
 *           example: "0 0 * * *"
 *         isActive:
 *           type: boolean
 *           description: Whether the job is active
 *           example: true
 *         jobType:
 *           type: string
 *           enum: [scheduled, immediate, recurring, delayed]
 *           description: Type of job
 *           example: "scheduled"
 *         payload:
 *           type: object
 *           description: Job configuration payload
 *           example: { "database": "users", "format": "json" }
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Job creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Job last update timestamp
 *         lastRunAt:
 *           type: string
 *           format: date-time
 *           description: Last execution timestamp
 *         nextRunAt:
 *           type: string
 *           format: date-time
 *           description: Next scheduled execution timestamp
 *         statistics:
 *           type: object
 *           properties:
 *             totalRuns:
 *               type: integer
 *               description: Total number of executions
 *             successfulRuns:
 *               type: integer
 *               description: Number of successful executions
 *             failedRuns:
 *               type: integer
 *               description: Number of failed executions
 *             successRate:
 *               type: string
 *               description: Success rate percentage
 *         configuration:
 *           type: object
 *           properties:
 *             timeoutMs:
 *               type: integer
 *               minimum: 1000
 *               maximum: 300000
 *               description: Execution timeout in milliseconds
 *             maxRetries:
 *               type: integer
 *               minimum: 0
 *               maximum: 10
 *               description: Maximum number of retries
 *             retryDelayMs:
 *               type: integer
 *               minimum: 1000
 *               maximum: 60000
 *               description: Delay between retries in milliseconds
 *         createdBy:
 *           type: string
 *           maxLength: 255
 *           description: User who created the job
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 50
 *           maxItems: 10
 *           description: Job tags for categorization
 *
 *     JobExecution:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Execution ID
 *         status:
 *           type: string
 *           enum: [running, completed, failed, timeout]
 *           description: Execution status
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: Execution start time
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Execution completion time
 *         durationMs:
 *           type: integer
 *           description: Execution duration in milliseconds
 *         errorMessage:
 *           type: string
 *           description: Error message if execution failed
 *         retryCount:
 *           type: integer
 *           description: Number of retry attempts
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Request success status
 *         data:
 *           type: object
 *           description: Response data
 *         message:
 *           type: string
 *           description: Response message
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Error type
 *         message:
 *           type: string
 *           description: Error message
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 *               value:
 *                 type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs with filtering and pagination
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of jobs per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *           enum: [scheduled, immediate, recurring, delayed]
 *         description: Filter by job type
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 255
 *         description: Search in job names
 *     responses:
 *       200:
 *         description: List of jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         jobs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Job'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             hasNext:
 *                               type: boolean
 *                             hasPrev:
 *                               type: boolean
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  sanitizeRequest,
  validateJobQuery,
  jobController.getAllJobs.bind(jobController)
);

/**
 * @swagger
 * /api/jobs/stats:
 *   get:
 *     summary: Get comprehensive job statistics
 *     tags: [Jobs, Statistics]
 *     responses:
 *       200:
 *         description: Job statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         scheduler:
 *                           type: object
 *                           properties:
 *                             totalExecutions:
 *                               type: integer
 *                             successfulExecutions:
 *                               type: integer
 *                             failedExecutions:
 *                               type: integer
 *                             averageExecutionTime:
 *                               type: number
 *                             isRunning:
 *                               type: boolean
 *                             activeJobs:
 *                               type: integer
 *                             runningExecutions:
 *                               type: integer
 *                             successRate:
 *                               type: string
 *                         cache:
 *                           type: object
 *                           properties:
 *                             hits:
 *                               type: integer
 *                             misses:
 *                               type: integer
 *                             hitRate:
 *                               type: string
 *                             size:
 *                               type: integer
 *                             memoryUsage:
 *                               type: string
 *                         database:
 *                           type: object
 *                           properties:
 *                             totalJobs:
 *                               type: integer
 *                             activeJobs:
 *                               type: integer
 *                             totalExecutions:
 *                               type: integer
 *                             recentExecutions:
 *                               type: integer
 *                             jobsByType:
 *                               type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/stats", jobController.getJobStats.bind(jobController));

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         job:
 *                           $ref: '#/components/schemas/Job'
 *                         executionHistory:
 *                           type: object
 *                           properties:
 *                             executions:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/JobExecution'
 *                             pagination:
 *                               type: object
 *                         isScheduled:
 *                           type: boolean
 *                           description: Whether job is currently scheduled
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", validateJobId, jobController.getJobById.bind(jobController));

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cronExpression
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Daily Data Backup"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Backup user data every day at midnight"
 *               cronExpression:
 *                 type: string
 *                 example: "0 0 * * *"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               jobType:
 *                 type: string
 *                 enum: [scheduled, immediate, recurring, delayed]
 *                 default: "scheduled"
 *               payload:
 *                 type: object
 *                 example: { "database": "users", "format": "json" }
 *               timeoutMs:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 300000
 *                 default: 30000
 *               maxRetries:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 default: 3
 *               retryDelayMs:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 60000
 *                 default: 5000
 *               createdBy:
 *                 type: string
 *                 maxLength: 255
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 50
 *                 maxItems: 10
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Job'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validateJobCreate,
  jobController.createJob.bind(jobController)
);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update existing job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               cronExpression:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               jobType:
 *                 type: string
 *                 enum: [scheduled, immediate, recurring, delayed]
 *               payload:
 *                 type: object
 *               timeoutMs:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 300000
 *               maxRetries:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *               retryDelayMs:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 60000
 *               createdBy:
 *                 type: string
 *                 maxLength: 255
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 50
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Job'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  "/:id",
  validateJobId,
  validateJobUpdate,
  jobController.updateJob.bind(jobController)
);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  validateJobId,
  jobController.deleteJob.bind(jobController)
);

/**
 * @swagger
 * /api/jobs/{id}/trigger:
 *   post:
 *     summary: Manually trigger job execution
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job execution triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         jobId:
 *                           type: string
 *                           format: uuid
 *                         jobName:
 *                           type: string
 *                         triggeredAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/:id/trigger",
  validateJobId,
  jobController.triggerJob.bind(jobController)
);

/**
 * @swagger
 * /api/jobs/{id}/executions:
 *   get:
 *     summary: Get job execution history
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of executions per page
 *     responses:
 *       200:
 *         description: Job execution history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         executions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/JobExecution'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id/executions",
  validateJobId,
  jobController.getJobExecutions.bind(jobController)
);

/**
 * @swagger
 * /jobs/validate-cron:
 *   post:
 *     summary: Validate cron expression
 *     description: Validates a cron expression and returns next execution times
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cronExpression
 *             properties:
 *               cronExpression:
 *                 type: string
 *                 description: Cron expression to validate
 *                 example: "* * * * *"
 *     responses:
 *       200:
 *         description: Cron expression validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     expression:
 *                       type: string
 *                       example: "* * * * *"
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *                     nextRuns:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: date-time
 *                       description: Next 5 execution times
 *                     timezone:
 *                       type: string
 *                       example: "Asia/Kolkata (IST)"
 *                     message:
 *                       type: string
 *                       example: "Valid cron expression"
 *       400:
 *         description: Invalid cron expression
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/validate-cron",
  jobController.validateCronExpression.bind(jobController)
);

module.exports = router;
