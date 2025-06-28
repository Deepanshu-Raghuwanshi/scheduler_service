import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useJobMutations } from "../hooks/useJobs";

const JobForm = ({ job, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!job;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      cronExpression: "0 0 * * *", // Daily at midnight
      isActive: true,
      jobType: "scheduled",
      payload: "{}",
      timeoutMs: 30000,
      maxRetries: 3,
      retryDelayMs: 5000,
      createdBy: "",
      tags: "",
    },
  });

  const { createJob, updateJob } = useJobMutations();

  // Pre-fill form when editing
  useEffect(() => {
    if (job) {
      setValue("name", job.name || "");
      setValue("description", job.description || "");
      setValue("cronExpression", job.cronExpression || "0 0 * * *");
      setValue("isActive", job.isActive ?? true);
      setValue("jobType", job.jobType || "scheduled");
      setValue("payload", JSON.stringify(job.payload || {}, null, 2));
      setValue("timeoutMs", job.configuration?.timeoutMs || 30000);
      setValue("maxRetries", job.configuration?.maxRetries || 3);
      setValue("retryDelayMs", job.configuration?.retryDelayMs || 5000);
      setValue("createdBy", job.createdBy || "");
      setValue("tags", job.tags ? job.tags.join(", ") : "");
    }
  }, [job, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Parse payload JSON
      let payload = {};
      if (data.payload.trim()) {
        try {
          payload = JSON.parse(data.payload);
        } catch (e) {
          throw new Error("Invalid JSON in payload field");
        }
      }

      // Parse tags
      const tags = data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const jobData = {
        name: data.name,
        description: data.description,
        cronExpression: data.cronExpression,
        isActive: data.isActive,
        jobType: data.jobType,
        payload,
        timeoutMs: parseInt(data.timeoutMs),
        maxRetries: parseInt(data.maxRetries),
        retryDelayMs: parseInt(data.retryDelayMs),
        createdBy: data.createdBy,
        tags: tags.length > 0 ? tags : undefined,
      };

      if (isEditing) {
        await updateJob({ jobId: job.id, updates: jobData });
      } else {
        await createJob(jobData);
      }

      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      // Error will be handled by the mutation hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  const cronPresets = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Daily at midnight", value: "0 0 * * *" },
    { label: "Daily at 9 AM", value: "0 9 * * *" },
    { label: "Weekly (Sunday midnight)", value: "0 0 * * 0" },
    { label: "Monthly (1st at midnight)", value: "0 0 1 * *" },
  ];

  const jobTypes = [
    { value: "scheduled", label: "Scheduled" },
    { value: "immediate", label: "Immediate" },
    { value: "recurring", label: "Recurring" },
    { value: "delayed", label: "Delayed" },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? "Edit Job" : "Create New Job"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                  Basic Information
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Name *
                  </label>
                  <input
                    type="text"
                    {...register("name", {
                      required: "Job name is required",
                      maxLength: {
                        value: 255,
                        message: "Name must be less than 255 characters",
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter job name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register("description", {
                      maxLength: {
                        value: 1000,
                        message:
                          "Description must be less than 1000 characters",
                      },
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter job description"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type
                  </label>
                  <select
                    {...register("jobType")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {jobTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Job is active
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created By
                  </label>
                  <input
                    type="text"
                    {...register("createdBy", {
                      maxLength: {
                        value: 255,
                        message:
                          "Creator name must be less than 255 characters",
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter creator name"
                  />
                  {errors.createdBy && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.createdBy.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    {...register("tags")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple tags with commas
                  </p>
                </div>
              </div>

              {/* Schedule & Configuration */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                  Schedule & Configuration
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cron Expression *
                  </label>
                  <input
                    type="text"
                    {...register("cronExpression", {
                      required: "Cron expression is required",
                      pattern: {
                        value:
                          /^(\*|[0-5]?[0-9]|\*\/[0-9]+) (\*|[01]?[0-9]|2[0-3]|\*\/[0-9]+) (\*|[12]?[0-9]|3[01]|\*\/[0-9]+) (\*|[01]?[0-9]|1[0-2]|\*\/[0-9]+) (\*|[0-6]|\*\/[0-9]+)$/,
                        message: "Invalid cron expression format",
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder="0 0 * * *"
                  />
                  {errors.cronExpression && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.cronExpression.message}
                    </p>
                  )}

                  {/* Cron Presets */}
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">Quick presets:</p>
                    <div className="flex flex-wrap gap-1">
                      {cronPresets.map((preset, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            setValue("cronExpression", preset.value)
                          }
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (milliseconds)
                  </label>
                  <input
                    type="number"
                    {...register("timeoutMs", {
                      min: {
                        value: 1000,
                        message: "Minimum timeout is 1000ms",
                      },
                      max: {
                        value: 300000,
                        message: "Maximum timeout is 300000ms",
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.timeoutMs && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.timeoutMs.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Retries
                  </label>
                  <input
                    type="number"
                    {...register("maxRetries", {
                      min: { value: 0, message: "Minimum retries is 0" },
                      max: { value: 10, message: "Maximum retries is 10" },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.maxRetries && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.maxRetries.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retry Delay (milliseconds)
                  </label>
                  <input
                    type="number"
                    {...register("retryDelayMs", {
                      min: {
                        value: 1000,
                        message: "Minimum retry delay is 1000ms",
                      },
                      max: {
                        value: 60000,
                        message: "Maximum retry delay is 60000ms",
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.retryDelayMs && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.retryDelayMs.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Payload (JSON)
                  </label>
                  <textarea
                    {...register("payload")}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder='{"key": "value"}'
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter valid JSON for job configuration
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? "Updating..." : "Creating..."}
                  </div>
                ) : isEditing ? (
                  "Update Job"
                ) : (
                  "Create Job"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobForm;
