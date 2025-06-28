import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useJob, useJobExecutions, useJobMutations } from "../hooks/useJobs";
import { format } from "date-fns";
import JobForm from "./JobForm";

const JobDetail = () => {
  const { id } = useParams();
  const [showEditForm, setShowEditForm] = useState(false);
  const [executionPage, setExecutionPage] = useState(1);

  const { job, executionHistory, isScheduled, isLoading, isError, error } =
    useJob(id);
  const { executions, pagination } = useJobExecutions(id, {
    page: executionPage,
  });
  const {
    deleteJob,
    triggerJob,
    toggleJobStatus,
    isDeleting,
    isTriggering,
    isTogglingStatus,
  } = useJobMutations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading job details...</span>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Error loading job details</h3>
        <p className="text-red-600 text-sm">
          {error?.message || "Job not found"}
        </p>
        <Link
          to="/jobs"
          className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
        >
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const colors = {
      running: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      timeout: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const getJobTypeBadge = (jobType) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      immediate: "bg-orange-100 text-orange-800",
      recurring: "bg-purple-100 text-purple-800",
      delayed: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[jobType] || "bg-gray-100 text-gray-800"
        }`}
      >
        {jobType}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/jobs"
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
          >
            ← Back to Jobs
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{job.name}</h1>
          <p className="text-gray-600">{job.description}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => triggerJob(job.id)}
            disabled={isTriggering}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {isTriggering ? "Triggering..." : "Trigger Now"}
          </button>

          <button
            onClick={() => toggleJobStatus(job.id, !job.isActive)}
            disabled={isTogglingStatus}
            className={`px-4 py-2 rounded-md font-medium disabled:opacity-50 ${
              job.isActive
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isTogglingStatus
              ? "Updating..."
              : job.isActive
              ? "Deactivate"
              : "Activate"}
          </button>

          <button
            onClick={() => setShowEditForm(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Edit
          </button>

          <button
            onClick={() => deleteJob(job.id)}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Job Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Details */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Job Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Status
              </label>
              <div className="mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {job.isActive ? "Active" : "Inactive"}
                </span>
                {isScheduled && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Scheduled
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Job Type
              </label>
              <div className="mt-1">{getJobTypeBadge(job.jobType)}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Cron Expression
              </label>
              <p className="mt-1 text-sm font-mono text-gray-900">
                {job.cronExpression}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Timeout
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {job.configuration?.timeoutMs || 30000}ms
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Max Retries
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {job.configuration?.maxRetries || 0}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Retry Delay
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {job.configuration?.retryDelayMs || 5000}ms
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Created By
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {job.createdBy || "Unknown"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Created At
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {job.createdAt
                  ? format(new Date(job.createdAt), "MMM dd, yyyy HH:mm")
                  : "Unknown"}
              </p>
            </div>
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-1">
                {job.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Payload */}
          {job.payload && Object.keys(job.payload).length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Payload
              </label>
              <pre className="bg-gray-50 border rounded-md p-3 text-xs overflow-x-auto">
                {JSON.stringify(job.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Total Runs
              </label>
              <p className="text-2xl font-bold text-gray-900">
                {job.statistics?.totalRuns || 0}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Successful Runs
              </label>
              <p className="text-xl font-semibold text-green-600">
                {job.statistics?.successfulRuns || 0}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Failed Runs
              </label>
              <p className="text-xl font-semibold text-red-600">
                {job.statistics?.failedRuns || 0}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Success Rate
              </label>
              <p className="text-xl font-semibold text-blue-600">
                {job.statistics?.successRate || "0%"}
              </p>
            </div>

            {job.lastRunAt && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Last Run
                </label>
                <p className="text-sm text-gray-900">
                  {format(new Date(job.lastRunAt), "MMM dd, yyyy HH:mm:ss")}
                </p>
              </div>
            )}

            {job.nextRunAt && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Next Run
                </label>
                <p className="text-sm text-gray-900">
                  {format(new Date(job.nextRunAt), "MMM dd, yyyy HH:mm:ss")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Execution History
          </h3>
        </div>

        {executions && executions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executions.map((execution) => (
                  <tr key={execution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(execution.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {execution.startedAt
                        ? format(
                            new Date(execution.startedAt),
                            "MMM dd, HH:mm:ss"
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {execution.completedAt
                        ? format(
                            new Date(execution.completedAt),
                            "MMM dd, HH:mm:ss"
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {execution.durationMs ? `${execution.durationMs}ms` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {execution.errorMessage || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No execution history available</p>
          </div>
        )}

        {/* Pagination for executions */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} executions
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setExecutionPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setExecutionPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Job Modal */}
      {showEditForm && (
        <JobForm job={job} onClose={() => setShowEditForm(false)} />
      )}
    </div>
  );
};

export default JobDetail;
