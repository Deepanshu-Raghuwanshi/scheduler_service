import React from "react";
import { useJobStats } from "../hooks/useJobs";
import { format } from "date-fns";

const Dashboard = () => {
  const { stats, isLoading, isError, error } = useJobStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
        <p className="text-red-600 text-sm">{error?.message}</p>
      </div>
    );
  }

  const { scheduler = {}, cache = {}, database = {} } = stats;

  const StatCard = ({ title, value, subtitle, color = "blue", icon }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 bg-${color}-100 rounded-md`}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {subtitle && (
                <dd className="text-sm text-gray-500">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, max, color = "blue" }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{label}</span>
          <span>
            {value} / {max}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {format(new Date(), "MMM dd, yyyy HH:mm:ss")}
        </div>
      </div>

      {/* Scheduler Status */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div
              className={`p-2 rounded-full ${
                scheduler.isRunning ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  scheduler.isRunning ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Scheduler Status: {scheduler.isRunning ? "Running" : "Stopped"}
              </h3>
              <p className="text-sm text-gray-500">
                {scheduler.isRunning
                  ? "All systems operational"
                  : "Scheduler is currently stopped"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Jobs"
          value={scheduler.activeJobs || 0}
          subtitle="Currently scheduled"
          color="blue"
          icon={
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />

        <StatCard
          title="Total Executions"
          value={scheduler.totalExecutions || 0}
          subtitle="All time"
          color="green"
          icon={
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />

        <StatCard
          title="Success Rate"
          value={`${scheduler.successRate || 0}%`}
          subtitle={`${scheduler.successfulExecutions || 0} successful`}
          color="emerald"
          icon={
            <svg
              className="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        <StatCard
          title="Running Jobs"
          value={scheduler.runningExecutions || 0}
          subtitle="Currently executing"
          color="yellow"
          icon={
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Statistics */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Execution Statistics
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Executions</span>
                <span className="text-sm font-medium text-gray-900">
                  {scheduler.totalExecutions || 0}
                </span>
              </div>

              <ProgressBar
                label="Successful"
                value={scheduler.successfulExecutions || 0}
                max={scheduler.totalExecutions || 1}
                color="green"
              />

              <ProgressBar
                label="Failed"
                value={scheduler.failedExecutions || 0}
                max={scheduler.totalExecutions || 1}
                color="red"
              />

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">
                  Average Execution Time
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {scheduler.averageExecutionTime
                    ? `${Math.round(scheduler.averageExecutionTime)}ms`
                    : "0ms"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Statistics */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Database Statistics
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Jobs</span>
                <span className="text-sm font-medium text-gray-900">
                  {database.totalJobs || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Jobs</span>
                <span className="text-sm font-medium text-gray-900">
                  {database.activeJobs || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Executions</span>
                <span className="text-sm font-medium text-gray-900">
                  {database.totalExecutions || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Recent Executions (24h)
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {database.recentExecutions || 0}
                </span>
              </div>

              {/* Job Types Breakdown */}
              {database.jobsByType && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 mb-2">Jobs by Type:</p>
                  <div className="space-y-1">
                    {Object.entries(database.jobsByType).map(
                      ([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="capitalize text-gray-500">
                            {type}
                          </span>
                          <span className="font-medium text-gray-900">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cache Statistics (if available) */}
      {cache && Object.keys(cache).length > 0 && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cache Statistics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {cache.hits || 0}
                </div>
                <div className="text-sm text-gray-500">Cache Hits</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {cache.misses || 0}
                </div>
                <div className="text-sm text-gray-500">Cache Misses</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {cache.hitRate || "0%"}
                </div>
                <div className="text-sm text-gray-500">Hit Rate</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {cache.size || 0}
                </div>
                <div className="text-sm text-gray-500">Cache Size</div>
              </div>
            </div>

            {cache.memoryUsage && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-900">
                    {cache.memoryUsage}
                  </div>
                  <div className="text-sm text-gray-500">Memory Usage</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Placeholder */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            System Health
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-500">Connected</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 ${
                    scheduler.isRunning ? "bg-green-100" : "bg-red-100"
                  } rounded-full flex items-center justify-center`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      scheduler.isRunning ? "text-green-600" : "text-red-600"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Scheduler</p>
                <p className="text-sm text-gray-500">
                  {scheduler.isRunning ? "Running" : "Stopped"}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">API</p>
                <p className="text-sm text-gray-500">Healthy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
