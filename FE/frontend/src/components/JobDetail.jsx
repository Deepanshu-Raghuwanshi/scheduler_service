"use client";

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useJob, useJobExecutions, useJobMutations } from "../hooks/useJobs";
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Loading Job Details
            </h3>
            <p className="text-gray-600">
              Please wait while we fetch the job information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-800">
                Error Loading Job Details
              </h3>
              <p className="text-red-700 mt-1">
                {error?.message || "Job not found"}
              </p>
              <div className="mt-4 flex space-x-3">
                <Link
                  to="/jobs"
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ← Back to Jobs
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-white hover:bg-gray-50 text-red-800 px-4 py-2 rounded-md text-sm font-medium border border-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      running: "bg-yellow-100 text-yellow-800 border-yellow-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      timeout: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          styles[status] || "bg-gray-100 text-gray-800 border-gray-200"
        }`}
      >
        {status}
      </span>
    );
  };

  const getJobTypeBadge = (jobType) => {
    const styles = {
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
      immediate: "bg-orange-100 text-orange-800 border-orange-200",
      recurring: "bg-purple-100 text-purple-800 border-purple-200",
      delayed: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          styles[jobType] || "bg-gray-100 text-gray-800 border-gray-200"
        }`}
      >
        {jobType}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      const month = parts.find((part) => part.type === "month")?.value;
      const day = parts.find((part) => part.type === "day")?.value;
      const year = parts.find((part) => part.type === "year")?.value;
      const hour = parts.find((part) => part.type === "hour")?.value;
      const minute = parts.find((part) => part.type === "minute")?.value;
      const second = parts.find((part) => part.type === "second")?.value;
      return `${month} ${day}, ${year} ${hour}:${minute}:${second}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          to="/jobs"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Jobs
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{job.name}</h1>
            <p className="text-gray-600 mt-2 text-lg">{job.description}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.isActive
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {job.isActive ? "Active" : "Inactive"}
              </span>
              {isScheduled && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-sm font-medium">
                  Scheduled
                </span>
              )}
              {getJobTypeBadge(job.jobType)}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => triggerJob(job.id)}
              disabled={isTriggering}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isTriggering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Triggering...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 6h1m4 0h1"
                    />
                  </svg>
                  <span>Trigger Now</span>
                </>
              )}
            </button>

            <button
              onClick={() => toggleJobStatus(job.id, !job.isActive)}
              disabled={isTogglingStatus}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                job.isActive
                  ? "bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white"
                  : "bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white"
              }`}
            >
              {isTogglingStatus ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>{job.isActive ? "Deactivate" : "Activate"}</span>
              )}
            </button>

            <button
              onClick={() => setShowEditForm(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Edit</span>
            </button>

            <button
              onClick={() => deleteJob(job.id)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Job Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Job Details */}
        <div className="xl:col-span-2 bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Cron Expression
                  </label>
                  <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg border">
                    {job.cronExpression}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Timeout
                  </label>
                  <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg border">
                    {job.configuration?.timeoutMs || 30000}ms
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Max Retries
                  </label>
                  <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg border">
                    {job.configuration?.maxRetries || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Created By
                  </label>
                  <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg border">
                    {job.createdBy || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Retry Delay
                  </label>
                  <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg border">
                    {job.configuration?.retryDelayMs || 5000}ms
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Created At
                  </label>
                  <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg border">
                    {job.createdAt ? formatDateTime(job.createdAt) : "Unknown"}
                  </p>
                </div>
                {job.lastRunAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Last Run
                    </label>
                    <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg border">
                      {formatDateTime(job.lastRunAt)}
                    </p>
                  </div>
                )}
                {job.nextRunAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Next Run
                    </label>
                    <p className="text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200 text-green-800">
                      {formatDateTime(job.nextRunAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-500 mb-3">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Payload */}
            {job.payload && Object.keys(job.payload).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-500 mb-3">
                  Payload
                </label>
                <pre className="bg-gray-50 border rounded-lg p-4 text-xs overflow-x-auto text-gray-800">
                  {JSON.stringify(job.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {job.statistics?.totalRuns || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Runs</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {job.statistics?.successfulRuns || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">
                  {job.statistics?.failedRuns || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Failed</div>
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {job.statistics?.successRate || "0%"}
              </div>
              <div className="text-sm text-gray-600 mt-1">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Execution History
          </h3>
        </div>

        {executions && executions.length > 0 ? (
          <>
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
                    <tr
                      key={execution.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
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
                        {execution.durationMs ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {execution.durationMs}ms
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                        {execution.errorMessage || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} executions
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setExecutionPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setExecutionPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No execution history
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This job hasn't been executed yet.
            </p>
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
