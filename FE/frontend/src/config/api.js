import axios from "axios";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging and auth
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log API calls in development
    if (import.meta.env.DEV) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        config.data
      );
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
        response.data
      );
    }
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem("auth_token");
          window.location.href = "/login";
          break;
        case 403:
          // Forbidden
          console.error("❌ Access forbidden");
          break;
        case 404:
          // Not found
          console.error("❌ Resource not found");
          break;
        case 422:
          // Validation error
          console.error("❌ Validation error:", data.details);
          break;
        case 500:
          // Server error
          console.error("❌ Server error");
          break;
        default:
          console.error(`❌ API Error (${status}):`, data);
      }

      // Return formatted error
      return Promise.reject({
        status,
        message: data.message || "An error occurred",
        details: data.details || [],
        timestamp: data.timestamp,
      });
    } else if (error.request) {
      // Network error
      console.error("❌ Network Error:", error.message);
      return Promise.reject({
        status: 0,
        message: "Network error. Please check your connection.",
        details: [],
      });
    } else {
      // Other error
      console.error("❌ Error:", error.message);
      return Promise.reject({
        status: 0,
        message: error.message,
        details: [],
      });
    }
  }
);

export default apiClient;
export { API_BASE_URL };
