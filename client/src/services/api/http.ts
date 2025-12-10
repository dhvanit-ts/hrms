import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Add request interceptor to include access token
http.interceptors.request.use(
  (config) => {
    // Get access token from auth context if available
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Function to get current access token (will be set by auth context)
let getAccessToken: () => string | null = () => null;

export function setAccessTokenGetter(getter: () => string | null) {
  getAccessToken = getter;
}

// Store callbacks for auth state management
let onRefreshSuccess: ((accessToken: string) => void) | null = null;
let onRefreshFailure: (() => void) | null = null;

// Track ongoing refresh to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

export function setAuthCallbacks(
  onSuccess: (accessToken: string) => void,
  onFailure: () => void
) {
  onRefreshSuccess = onSuccess;
  onRefreshFailure = onFailure;
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Check if this is a 401 error and we haven't already retried this request
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (original.headers) {
            original.headers.Authorization = `Bearer ${token}`;
          }
          return http(original);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // Mark this request as retried to prevent infinite loops
      original._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the access token using the refresh token cookie
        const refreshResponse = await http.post("/auth/refresh");
        const newAccessToken = refreshResponse.data.accessToken;

        // Update the Authorization header with the new access token
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Notify the auth context of the new token
        if (onRefreshSuccess) {
          onRefreshSuccess(newAccessToken);
        }

        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry the original request with the new token
        return http(original);
      } catch (refreshError) {
        // Process queued requests with error
        processQueue(refreshError, null);

        // Refresh failed - clear auth state and redirect to login
        if (onRefreshFailure) {
          onRefreshFailure();
        }

        // Reject with the original error
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
