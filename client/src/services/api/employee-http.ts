import axios from "axios";

export const employeeHttp = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Store callbacks for auth state management
let onRefreshSuccess: ((accessToken: string) => void) | null = null;
let onRefreshFailure: (() => void) | null = null;

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
      original._retry = true;
      
      try {
        const refreshResponse = await employeeHttp.post("/auth/employee/refresh");
        const newAccessToken = refreshResponse.data.accessToken;
        
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        if (onRefreshSuccess) {
          onRefreshSuccess(newAccessToken);
        }
        
        return employeeHttp(original);
      } catch (refreshError) {
        if (onRefreshFailure) {
          onRefreshFailure();
        }
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);
