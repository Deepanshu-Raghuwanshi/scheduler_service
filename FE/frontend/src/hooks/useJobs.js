import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import jobService from "../services/jobService";
import { toast } from "react-toastify";

/**
 * Custom hook for managing jobs data and operations
 */
export const useJobs = (initialParams = {}) => {
  const [params, setParams] = useState({
    page: 1,
    limit: 50,
    ...initialParams,
  });

  const queryClient = useQueryClient();

  // Fetch jobs query
  const {
    data: jobsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(["jobs", params], () => jobService.getAllJobs(params), {
    keepPreviousData: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
    onError: (error) => {
      toast.error(`Failed to load jobs: ${error.message}`);
    },
  });

  // Update params function
  const updateParams = useCallback((newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  // Reset to first page
  const resetToFirstPage = useCallback(() => {
    setParams((prev) => ({ ...prev, page: 1 }));
  }, []);

  return {
    jobs: jobsData?.data?.jobs || [],
    pagination: jobsData?.data?.pagination || {},
    isLoading,
    isError,
    error,
    params,
    updateParams,
    resetToFirstPage,
    refetch,
  };
};

/**
 * Custom hook for managing a single job
 */
export const useJob = (jobId) => {
  const queryClient = useQueryClient();

  const {
    data: jobData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(["job", jobId], () => jobService.getJobById(jobId), {
    enabled: !!jobId,
    staleTime: 30000,
    onError: (error) => {
      toast.error(`Failed to load job: ${error.message}`);
    },
  });

  return {
    job: jobData?.data?.job,
    executionHistory: jobData?.data?.executionHistory,
    isScheduled: jobData?.data?.isScheduled,
    isLoading,
    isError,
    error,
    refetch,
  };
};

/**
 * Custom hook for job statistics
 */
export const useJobStats = () => {
  const {
    data: statsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(["jobStats"], () => jobService.getJobStats(), {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
    onError: (error) => {
      toast.error(`Failed to load statistics: ${error.message}`);
    },
  });

  return {
    stats: statsData?.data || {},
    isLoading,
    isError,
    error,
    refetch,
  };
};

/**
 * Custom hook for job execution history
 */
export const useJobExecutions = (jobId, initialParams = {}) => {
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    ...initialParams,
  });

  const {
    data: executionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(
    ["jobExecutions", jobId, params],
    () => jobService.getJobExecutions(jobId, params),
    {
      enabled: !!jobId,
      keepPreviousData: true,
      staleTime: 15000,
      onError: (error) => {
        toast.error(`Failed to load executions: ${error.message}`);
      },
    }
  );

  const updateParams = useCallback((newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  return {
    executions: executionsData?.data?.executions || [],
    pagination: executionsData?.data?.pagination || {},
    isLoading,
    isError,
    error,
    params,
    updateParams,
    refetch,
  };
};

/**
 * Custom hook for job mutations (create, update, delete, trigger)
 */
export const useJobMutations = () => {
  const queryClient = useQueryClient();

  // Create job mutation
  const createMutation = useMutation(
    (jobData) => jobService.createJob(jobData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(["jobs"]);
        queryClient.invalidateQueries(["jobStats"]);
        toast.success(`Job "${data.data.name}" created successfully!`);
      },
      onError: (error) => {
        toast.error(`Failed to create job: ${error.message}`);
      },
    }
  );

  // Update job mutation
  const updateMutation = useMutation(
    ({ jobId, updates }) => jobService.updateJob(jobId, updates),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(["jobs"]);
        queryClient.invalidateQueries(["job", variables.jobId]);
        queryClient.invalidateQueries(["jobStats"]);
        toast.success(`Job "${data.data.name}" updated successfully!`);
      },
      onError: (error) => {
        toast.error(`Failed to update job: ${error.message}`);
      },
    }
  );

  // Delete job mutation
  const deleteMutation = useMutation((jobId) => jobService.deleteJob(jobId), {
    onSuccess: (data) => {
      queryClient.invalidateQueries(["jobs"]);
      queryClient.invalidateQueries(["jobStats"]);
      toast.success(`Job "${data.data.name}" deleted successfully!`);
    },
    onError: (error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    },
  });

  // Trigger job mutation
  const triggerMutation = useMutation((jobId) => jobService.triggerJob(jobId), {
    onSuccess: (data) => {
      queryClient.invalidateQueries(["jobExecutions", data.data.jobId]);
      toast.success(`Job "${data.data.jobName}" triggered successfully!`);
    },
    onError: (error) => {
      toast.error(`Failed to trigger job: ${error.message}`);
    },
  });

  // Toggle job status mutation
  const toggleStatusMutation = useMutation(
    ({ jobId, isActive }) => jobService.toggleJobStatus(jobId, isActive),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(["jobs"]);
        queryClient.invalidateQueries(["job", data.data.id]);
        queryClient.invalidateQueries(["jobStats"]);
        const status = data.data.isActive ? "activated" : "deactivated";
        toast.success(`Job "${data.data.name}" ${status} successfully!`);
      },
      onError: (error) => {
        toast.error(`Failed to toggle job status: ${error.message}`);
      },
    }
  );

  // Bulk operations mutation
  const bulkOperationMutation = useMutation(
    ({ jobIds, operation }) => jobService.bulkOperation(jobIds, operation),
    {
      onSuccess: (results, variables) => {
        queryClient.invalidateQueries(["jobs"]);
        queryClient.invalidateQueries(["jobStats"]);

        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        if (successful > 0) {
          toast.success(
            `${successful} job(s) ${variables.operation}d successfully!`
          );
        }
        if (failed > 0) {
          toast.error(`${failed} job(s) failed to ${variables.operation}`);
        }
      },
      onError: (error) => {
        toast.error(`Bulk operation failed: ${error.message}`);
      },
    }
  );

  return {
    createJob: createMutation.mutate,
    updateJob: updateMutation.mutate,
    deleteJob: deleteMutation.mutate,
    triggerJob: triggerMutation.mutate,
    toggleJobStatus: toggleStatusMutation.mutate,
    bulkOperation: bulkOperationMutation.mutate,

    // Loading states
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isTriggering: triggerMutation.isLoading,
    isTogglingStatus: toggleStatusMutation.isLoading,
    isBulkOperating: bulkOperationMutation.isLoading,

    // Error states
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    triggerError: triggerMutation.error,
    toggleStatusError: toggleStatusMutation.error,
    bulkOperationError: bulkOperationMutation.error,
  };
};
