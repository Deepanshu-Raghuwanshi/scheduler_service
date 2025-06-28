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

// GET /api/jobs - List all jobs
router.get(
  "/",
  sanitizeRequest,
  validateJobQuery,
  jobController.getAllJobs.bind(jobController)
);

// GET /api/jobs/stats - Get statistics (must come before /:id route)
router.get("/stats", jobController.getJobStats.bind(jobController));

// GET /api/jobs/:id - Get specific job
router.get("/:id", validateJobId, jobController.getJobById.bind(jobController));

// POST /api/jobs - Create new job
router.post(
  "/",
  validateJobCreate,
  jobController.createJob.bind(jobController)
);

// PUT /api/jobs/:id - Update job
router.put(
  "/:id",
  validateJobId,
  validateJobUpdate,
  jobController.updateJob.bind(jobController)
);

// DELETE /api/jobs/:id - Delete job
router.delete(
  "/:id",
  validateJobId,
  jobController.deleteJob.bind(jobController)
);

// POST /api/jobs/:id/trigger - Trigger job
router.post(
  "/:id/trigger",
  validateJobId,
  jobController.triggerJob.bind(jobController)
);

// GET /api/jobs/:id/executions - Get job executions
router.get(
  "/:id/executions",
  validateJobId,
  jobController.getJobExecutions.bind(jobController)
);

module.exports = router;
