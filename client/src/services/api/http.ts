import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Store callbacks for auth state management
let onRefreshSuccess: ((accessToken: string) => void) | null = null;
let onRefreshFailure: (() => void) | null = null;

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
      // Mark this request as retried to prevent infinite loops
      original._retry = true;
      
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
        
        // Retry the original request with the new token
        return http(original);
      } catch (refreshError) {
        // Refresh failed - clear auth state and redirect to login
        if (onRefreshFailure) {
          onRefreshFailure();
        }
        
        // Reject with the original error
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);
