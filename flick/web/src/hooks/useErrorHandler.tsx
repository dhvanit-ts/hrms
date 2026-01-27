/* eslint-disable @typescript-eslint/no-explicit-any */
import { env } from "@/conf/env";
import useProfileStore from "@/store/profileStore";
import { IUser } from "@/types/User";
import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export const useErrorHandler = () => {
  const setProfile = useProfileStore(state => state.setProfile);
  const removeProfile = useProfileStore(state => state.removeProfile);

  const refreshPromiseRef = useRef<Promise<IUser> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortController.current?.abort();
    };
  }, []);

  const refreshAccessToken = useCallback(async (signal?: AbortSignal) => {
    if (!env.serverApiEndpoint) {
      throw new Error("Missing VITE_SERVER_API_ENDPOINT env variable");
    }

    try {
      const { data } = await axios.post(
        `${env.serverApiEndpoint}/users/refresh`,
        {},
        {
          withCredentials: true,
          signal,
        }
      );
      setProfile(data);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        removeProfile();
        throw new Error("Session invalid"); // Explicit signal for invalid refresh
      }
      throw error; // Retryable / network error, let it bubble
    }
  }, [removeProfile, setProfile]);

  const extractErrorMessage = (
    error: AxiosError | Error,
    fallback: string
  ): string => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as Record<string, any> | undefined;
      return data?.message || data?.error || error.message || fallback;
    }
    return error.message || fallback;
  };

  const reportError = (msg: string, setError?: (msg: string) => void) => {
    if (setError) setError(msg); else toast.error(msg);
  };

  const handleError = useCallback(async (
    error: AxiosError | Error,
    fallbackMessage: string,
    setError?: (errorMsg: string) => void,
    originalReq?: () => Promise<any>,
    refreshFailMessage = "Session expired, please log in again.",
    onError?: () => void,
    hasRetried = false,
  ): Promise<any> => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const code = error.response.data?.code;
      const shouldRefresh = error.response.data?.error === "Unauthorized" && !hasRetried;

      if (code === "INVALID_SESSION") {
        removeProfile();
        reportError("Session invalid. Please log in again.", setError);
        onError?.();
        return;
      }

      if (shouldRefresh && originalReq) {
        abortController.current = new AbortController();
        const { signal } = abortController.current;

        try {
          if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = refreshAccessToken(signal).finally(() => {
              refreshPromiseRef.current = null;
            });
          }

          await refreshPromiseRef.current;

          return await originalReq();
        } catch (refreshError) {
          const msg = extractErrorMessage(refreshError as AxiosError, refreshFailMessage);
          removeProfile();
          if (msg !== "Session invalid") reportError(msg, setError);
          onError?.();
          return;
        }
      } else {
        removeProfile();
        reportError(refreshFailMessage, setError);
        onError?.();
        return;
      }
    }

    const message = extractErrorMessage(error, fallbackMessage);
    reportError(message, setError);
    onError?.();
  }, [refreshAccessToken, removeProfile]);

  return { handleError };
};
