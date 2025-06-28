"use client";
import { useJobStats } from "../hooks/useJobs";
import { format } from "date-fns";

const Dashboard = () => {
  const { stats, isLoading, isError, error } = useJobStats();

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
              Loading Dashboard
            </h3>
            <p className="text-gray-600">
              Please wait while we fetch your data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto mt-8">
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
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                Error Loading Dashboard
              </h3>
              <p className="text-red-700 mt-1">{error?.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { scheduler = {}, cache = {}, database = {} } = stats;

  const StatCard = ({
    title,
    value,
    subtitle,
    color = "blue",
    icon,
    trend,
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-lg bg-gradient-to-br from-${color}-50 to-${color}-100`}
              >
                <div className={`text-${color}-600`}>{icon}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {subtitle && (
                  <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
          {trend && (
            <div
              className={`flex items-center text-sm ${
                trend > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d={
                    trend > 0
                      ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                      : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                  }
                  clipRule="evenodd"
                />
              </svg>
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, max, color = "blue" }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {value} / {max}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          ></div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor your job scheduler performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Data</span>
          </div>
          <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border">
            Last updated: {format(new Date(), "MMM dd, yyyy HH:mm:ss")}
          </div>
        </div>
      </div>

      {/* Scheduler Status Banner */}
      <div
        className={`rounded-xl p-6 ${
          scheduler.isRunning
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
            : "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 rounded-full ${
                scheduler.isRunning ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  scheduler.isRunning ? "bg-green-500" : "bg-red-500"
                } ${scheduler.isRunning ? "animate-pulse" : ""}`}
              ></div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Scheduler Status: {scheduler.isRunning ? "Running" : "Stopped"}
              </h3>
              <p className="text-gray-600 mt-1">
                {scheduler.isRunning
                  ? "All systems operational and processing jobs"
                  : "Scheduler is currently stopped - no jobs will execute"}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                scheduler.isRunning
                  ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                  : "bg-green-100 hover:bg-green-200 text-green-800"
              }`}
            >
              {scheduler.isRunning ? "Stop Scheduler" : "Start Scheduler"}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Jobs"
          value={scheduler.activeJobs || 0}
          subtitle="Currently scheduled"
          color="blue"
          trend={5}
          icon={
            <svg
              className="w-6 h-6"
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
          trend={12}
          icon={
            <svg
              className="w-6 h-6"
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
          trend={3}
          icon={
            <svg
              className="w-6 h-6"
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
          trend={-2}
          icon={
            <svg
              className="w-6 h-6"
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Execution Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Execution Statistics
              </h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">
                Total Executions
              </span>
              <span className="text-xl font-bold text-gray-900">
                {scheduler.totalExecutions || 0}
              </span>
            </div>

            <div className="space-y-4">
              <ProgressBar
                label="Successful Executions"
                value={scheduler.successfulExecutions || 0}
                max={scheduler.totalExecutions || 1}
                color="green"
              />
              <ProgressBar
                label="Failed Executions"
                value={scheduler.failedExecutions || 0}
                max={scheduler.totalExecutions || 1}
                color="red"
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Execution Time</span>
                <span className="font-semibold text-gray-900 bg-blue-50 px-3 py-1 rounded-full">
                  {scheduler.averageExecutionTime
                    ? `${Math.round(scheduler.averageExecutionTime)}ms`
                    : "0ms"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Database Statistics
              </h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {database.totalJobs || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Jobs</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {database.activeJobs || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active Jobs</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {database.totalExecutions || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Total Executions
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {database.recentExecutions || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Recent (24h)</div>
              </div>
            </div>

            {/* Job Types Breakdown */}
            {database.jobsByType && (
              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">Jobs by Type</h4>
                <div className="space-y-2">
                  {Object.entries(database.jobsByType).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="capitalize text-gray-700 font-medium">
                        {type}
                      </span>
                      <span className="bg-white px-2 py-1 rounded text-sm font-semibold text-gray-900">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cache Statistics */}
      {cache && Object.keys(cache).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-orange-600"
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
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cache Statistics
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {cache.hits || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Cache Hits</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {cache.misses || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Cache Misses</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {cache.hitRate || "0%"}
                </div>
                <div className="text-sm text-gray-600 mt-1">Hit Rate</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {cache.size || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Cache Size</div>
              </div>
            </div>
            {cache.memoryUsage && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xl font-semibold text-gray-900">
                  {cache.memoryUsage}
                </div>
                <div className="text-sm text-gray-600 mt-1">Memory Usage</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-teal-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-5 h-5 text-green-600"
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
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              System Health
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
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
              <div>
                <p className="font-semibold text-gray-900">Database</p>
                <p className="text-sm text-green-600">Connected & Healthy</p>
              </div>
            </div>

            <div
              className={`flex items-center space-x-4 p-4 rounded-lg ${
                scheduler.isRunning ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    scheduler.isRunning ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${
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
              <div>
                <p className="font-semibold text-gray-900">Scheduler</p>
                <p
                  className={`text-sm ${
                    scheduler.isRunning ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {scheduler.isRunning ? "Running" : "Stopped"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
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
              <div>
                <p className="font-semibold text-gray-900">API</p>
                <p className="text-sm text-green-600">Healthy & Responsive</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
