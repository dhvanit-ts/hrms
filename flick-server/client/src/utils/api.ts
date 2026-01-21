// api.ts
import axios from "axios";
import { env } from "@/conf/env";
import useProfileStore from "@/store/profileStore";
import { toast } from "sonner";

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

// Extend config type to add `_retry`
interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: env.serverApiEndpoint,
  withCredentials: true,
});

// queue up a single refresh
let refreshing: Promise<AxiosResponse> | null = null;

api.interceptors.response.use(
  (resp) => resp,
  async (err) => {
    const status = err.response?.status;
    const isAuthErr = axios.isAxiosError(err) && status === 401;

    if (isAuthErr) {
      const { removeProfile, setProfile } = useProfileStore.getState();

      // only one refresh at a time
      if (!refreshing) {
        refreshing = axios
          .post("/users/refresh", {}, { withCredentials: true })
          .then((r) => {
            setProfile(r.data.data);
            return r;
          })
          .catch((e) => {
            removeProfile();
            throw e;
          })
          .finally(() => (refreshing = null));
      }

      await refreshing;
      // retry original
      if (!err.config) {
        // Seriously, you can't retry without config
        return Promise.reject(err);
      }

      const originalRequest = err.config as RetryAxiosRequestConfig;

      if (!originalRequest) {
        return Promise.reject(err);
      }

      if (!originalRequest._retry) {
        originalRequest._retry = true;
        return api(originalRequest);
      } else {
        removeProfile();
        toast.error("Session expired. Please log in again.");
        return Promise.reject(err);
      }
    }

    // non‑401 errors
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Something went wrong";
    toast.error(msg);
    return Promise.reject(err);
  }
);

export default api;
