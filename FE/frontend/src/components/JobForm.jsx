"use client";

import { useState, useEffect } from "react";
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
      cronExpression: "0 0 * * *",
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
      let payload = {};
      if (data.payload.trim()) {
        try {
          payload = JSON.parse(data.payload);
        } catch (e) {
          throw new Error("Invalid JSON in payload field");
        }
      }

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
        timeoutMs: Number.parseInt(data.timeoutMs),
        maxRetries: Number.parseInt(data.maxRetries),
        retryDelayMs: Number.parseInt(data.retryDelayMs),
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
    { label: "Weekly (Sunday)", value: "0 0 * * 0" },
    { label: "Monthly (1st)", value: "0 0 1 * *" },
  ];

  const jobTypes = [
    { value: "scheduled", label: "Scheduled" },
    { value: "immediate", label: "Immediate" },
    { value: "recurring", label: "Recurring" },
    { value: "delayed", label: "Delayed" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit Job" : "Create New Job"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isEditing
                  ? "Update job configuration and settings"
                  : "Configure your new scheduled job"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Basic Information
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Name <span className="text-red-500">*</span>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter a descriptive job name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Describe what this job does..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type
                    </label>
                    <select
                      {...register("jobType")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {jobTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Job is active and ready to run
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Created By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("createdBy", {
                        required: {
                          value: true,
                          message: "Created by field is required",
                        },
                        minLength: {
                          value: 1,
                          message: "Created by field cannot be empty",
                        },
                        maxLength: {
                          value: 255,
                          message:
                            "Creator name must be less than 255 characters",
                        },
                        validate: {
                          notEmpty: (value) =>
                            value.trim().length > 0 ||
                            "Created by field cannot be empty or just whitespace",
                        },
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter creator name"
                    />
                    {errors.createdBy && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.createdBy.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      {...register("tags")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="production, daily, backup"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate multiple tags with commas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule & Configuration */}
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-lg font-medium text-green-900 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Schedule & Configuration
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cron Expression <span className="text-red-500">*</span>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono transition-colors"
                      placeholder="0 0 * * *"
                    />
                    {errors.cronExpression && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.cronExpression.message}
                      </p>
                    )}

                    {/* Cron Presets */}
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">
                        Quick presets:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {cronPresets.map((preset, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() =>
                              setValue("cronExpression", preset.value)
                            }
                            className="px-3 py-2 text-xs bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors text-left"
                          >
                            <div className="font-medium text-gray-900">
                              {preset.label}
                            </div>
                            <div className="font-mono text-gray-500">
                              {preset.value}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout (ms)
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      {errors.timeoutMs && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.timeoutMs.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Retries
                      </label>
                      <input
                        type="number"
                        {...register("maxRetries", {
                          min: { value: 0, message: "Minimum retries is 0" },
                          max: { value: 10, message: "Maximum retries is 10" },
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      {errors.maxRetries && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.maxRetries.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retry Delay (ms)
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    {errors.retryDelayMs && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.retryDelayMs.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Payload (JSON)
                    </label>
                    <textarea
                      {...register("payload")}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
                      placeholder='{"key": "value", "config": {"enabled": true}}'
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter valid JSON for job configuration and parameters
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8 -mx-6 -mb-6 rounded-b-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isEditing ? "Updating..." : "Creating..."}</span>
                  </>
                ) : (
                  <span>{isEditing ? "Update Job" : "Create Job"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;
