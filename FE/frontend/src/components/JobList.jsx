import React, { useState, useEffect } from "react";
import { useJobs, useJobMutations } from "../hooks/useJobs";
import JobForm from "./JobForm";
import { format, parseISO } from "date-fns";

const JobList = () => {
  const [filters, setFilters] = useState({
    search: "",
    jobType: "",
    isActive: "",
    tags: "",
  });
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const {
    jobs,
    pagination,
    isLoading,
    isError,
    error,
    params,
    updateParams,
    resetToFirstPage,
  } = useJobs();

  const {
    deleteJob,
    triggerJob,
    toggleJobStatus,
    bulkOperation,
    isDeleting,
    isTriggering,
    isTogglingStatus,
    isBulkOperating,
  } = useJobMutations();

  // Apply filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ ...filters, page: 1 });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, updateParams]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
  };

  const handleJobSelect = (jobId) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map((job) => job.id)));
    }
  };

  const handleBulkAction = (action) => {
    if (selectedJobs.size === 0) return;

    const jobIds = Array.from(selectedJobs);
    bulkOperation({ jobIds, operation: action });
    setSelectedJobs(new Set());
  };

  const getStatusBadge = (isActive) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );

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

  const formatDateTime = (dateString) => {
    if (!dateString) return null;

    try {
      // Parse the date string (it's in UTC format with Z suffix)
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      // Convert to IST using Intl.DateTimeFormat for better reliability
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const parts = formatter.formatToParts(date);
      const month = parts.find((part) => part.type === "month")?.value;
      const day = parts.find((part) => part.type === "day")?.value;
      const hour = parts.find((part) => part.type === "hour")?.value;
      const minute = parts.find((part) => part.type === "minute")?.value;

      return `${month} ${day}, ${hour}:${minute}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      // Fallback to simple conversion
      try {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } catch (fallbackError) {
        return "Invalid date";
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading jobs...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Error loading jobs</h3>
        <p className="text-red-600 text-sm">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Job Scheduler</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Create New Job
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search jobs..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Type
            </label>
            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange("jobType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="scheduled">Scheduled</option>
              <option value="immediate">Immediate</option>
              <option value="recurring">Recurring</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange("isActive", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              placeholder="tag1,tag2"
              value={filters.tags}
              onChange={(e) => handleFilterChange("tags", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedJobs.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedJobs.size} job(s) selected
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleBulkAction("activate")}
                disabled={isBulkOperating}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                disabled={isBulkOperating}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                disabled={isBulkOperating}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={jobs.length > 0 && selectedJobs.size === jobs.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statistics
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedJobs.has(job.id)}
                    onChange={() => handleJobSelect(job.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {job.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {job.description}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {getJobTypeBadge(job.jobType)}
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {job.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {job.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{job.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-mono">
                    {job.cronExpression}
                  </div>
                  {job.nextRunAt && (
                    <div className="text-sm text-gray-500">
                      Next: {formatDateTime(job.nextRunAt)}
                    </div>
                  )}
                  {job.lastRunAt && (
                    <div className="text-sm text-gray-500">
                      Last: {formatDateTime(job.lastRunAt)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">{getStatusBadge(job.isActive)}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    Runs: {job.statistics?.totalRuns || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    Success Rate: {job.statistics?.successRate || "0%"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => triggerJob(job.id)}
                      disabled={isTriggering}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Trigger
                    </button>
                    <button
                      onClick={() => toggleJobStatus(job.id, !job.isActive)}
                      disabled={isTogglingStatus}
                      className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                    >
                      {job.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => setEditingJob(job)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteJob(job.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No jobs found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>

            {/* Page numbers */}
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum <= pagination.totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        pageNum === pagination.page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              }
            )}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Job Modal */}
      {(showCreateForm || editingJob) && (
        <JobForm
          job={editingJob}
          onClose={() => {
            setShowCreateForm(false);
            setEditingJob(null);
          }}
        />
      )}
    </div>
  );
};

export default JobList;
