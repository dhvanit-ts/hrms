import axios from "axios";

export const employeeHttp = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Add request interceptor to include access token
employeeHttp.interceptors.request.use(
  (config) => {
    // Get access token from auth context if available
    const token = getEmployeeAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Function to get current access token (will be set by auth context)
let getEmployeeAccessToken: () => string | null = () => null;

export function setEmployeeAccessTokenGetter(getter: () => string | null) {
  getEmployeeAccessToken = getter;
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

export function setEmployeeAuthCallbacks(
  onSuccess: (accessToken: string) => void,
  onFailure: () => void
) {
  onRefreshSuccess = onSuccess;
  onRefreshFailure = onFailure;
}

employeeHttp.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (original.headers) {
            original.headers.Authorization = `Bearer ${token}`;
          }
          return employeeHttp(original);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await employeeHttp.post("/auth/employee/refresh");
        const newAccessToken = refreshResponse.data.accessToken;

        if (original.headers) {
          original.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        if (onRefreshSuccess) {
          onRefreshSuccess(newAccessToken);
        }

        // Process queued requests
        processQueue(null, newAccessToken);

        return employeeHttp(original);
      } catch (refreshError) {
        // Process queued requests with error
        processQueue(refreshError, null);

        if (onRefreshFailure) {
          onRefreshFailure();
        }

        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
