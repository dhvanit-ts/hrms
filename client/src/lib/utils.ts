import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a user-friendly error message from various error formats
 * @param error - The error object from API calls or other sources
 * @returns A user-friendly error message string
 */
export function extractErrorMessage(error: any): string {
  // Check for axios-style error response with message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for error message property
  if (error.message) {
    return error.message;
  }

  // Check for network errors (status 0 typically indicates network failure)
  if (error.response?.status === 0) {
    return "Network error - please check your connection";
  }

  // Check for other response data formats
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // Fallback for unknown error formats
  return "An unexpected error occurred";
}
