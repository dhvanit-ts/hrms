/**
 * Test Utilities for Frontend Testing
 * 
 * This module provides helper functions for testing React components,
 * including rendering with AuthContext, mocking API responses, and form interactions.
 */

import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/shared/context/AuthContext";
import type { AxiosResponse } from "axios";

/**
 * Custom render function that wraps components with necessary providers
 * 
 * @param ui - The React component to render
 * @param options - Optional render options
 * @returns The render result from @testing-library/react
 */
export function renderWithAuth(
    ui: React.ReactElement,
    options?: Omit<RenderOptions, "wrapper">
) {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
            <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
    );

    return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Creates a mock Axios response object for testing
 * 
 * @param data - The response data
 * @param status - HTTP status code (defaults to 200)
 * @param statusText - HTTP status text (defaults to "OK")
 * @returns A mock AxiosResponse object
 */
export function mockApiResponse<T = any>(
    data: T,
    status = 200,
    statusText = "OK"
): AxiosResponse<T> {
    return {
        data,
        status,
        statusText,
        headers: {},
        config: {
            headers: {} as any,
        },
    };
}

/**
 * Creates a mock Axios error for testing error scenarios
 * 
 * @param message - Error message
 * @param status - HTTP status code (defaults to 400)
 * @param data - Optional error response data
 * @returns A mock error object
 */
export function mockApiError(
    message: string,
    status = 400,
    data?: any
) {
    const error: any = new Error(message);
    error.response = {
        data: data || { message },
        status,
        statusText: getStatusText(status),
        headers: {},
        config: {
            headers: {} as any,
        },
    };
    error.isAxiosError = true;
    return error;
}

/**
 * Helper to get status text from status code
 */
function getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
        200: "OK",
        201: "Created",
        204: "No Content",
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        429: "Too Many Requests",
        500: "Internal Server Error",
    };
    return statusTexts[status] || "Unknown";
}

/**
 * Fills in the login form fields with the provided values
 * 
 * @param getByLabelText - The getByLabelText query from @testing-library/react
 * @param email - Email address to fill in
 * @param password - Password to fill in
 */
export function fillLoginForm(
    getByLabelText: (text: string | RegExp) => HTMLElement,
    email: string,
    password: string
): void {
    const emailInput = getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = getByLabelText(/password/i) as HTMLInputElement;

    emailInput.value = email;
    passwordInput.value = password;

    // Trigger change events
    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Waits for a loading state to appear and then disappear
 * 
 * @param findByText - The findByText query from @testing-library/react
 * @param queryByText - The queryByText query from @testing-library/react
 * @param loadingText - The text to look for in the loading state (defaults to "Loading")
 * @param timeout - Maximum time to wait in milliseconds (defaults to 3000)
 */
export async function waitForLoadingState(
    findByText: (text: string | RegExp) => Promise<HTMLElement>,
    queryByText: (text: string | RegExp) => HTMLElement | null,
    loadingText: string | RegExp = /loading/i,
    timeout = 3000
): Promise<void> {
    try {
        // Wait for loading state to appear
        await findByText(loadingText);

        // Wait for loading state to disappear
        const startTime = Date.now();
        while (queryByText(loadingText) !== null) {
            if (Date.now() - startTime > timeout) {
                throw new Error(`Loading state did not disappear within ${timeout}ms`);
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    } catch (error) {
        // If loading state never appears, that's okay - operation might be instant
        if (error instanceof Error && error.message.includes("Unable to find")) {
            return;
        }
        throw error;
    }
}

/**
 * Creates a mock user object for testing
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A mock user object
 */
export function createMockUser(overrides?: {
    email?: string;
    roles?: string[];
    id?: string;
}) {
    return {
        email: overrides?.email || "test@example.com",
        roles: overrides?.roles || ["EMPLOYEE"],
        id: overrides?.id || "1",
    };
}

/**
 * Creates a mock auth response for testing
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A mock auth response object
 */
export function createMockAuthResponse(overrides?: {
    user?: any;
    accessToken?: string;
}) {
    return {
        user: overrides?.user || createMockUser(),
        accessToken: overrides?.accessToken || "mock-access-token-123",
    };
}

/**
 * Waits for an element to be removed from the DOM
 * 
 * @param queryByText - The queryByText query from @testing-library/react
 * @param text - The text to wait for removal
 * @param timeout - Maximum time to wait in milliseconds (defaults to 3000)
 */
export async function waitForElementRemoval(
    queryByText: (text: string | RegExp) => HTMLElement | null,
    text: string | RegExp,
    timeout = 3000
): Promise<void> {
    const startTime = Date.now();
    while (queryByText(text) !== null) {
        if (Date.now() - startTime > timeout) {
            throw new Error(`Element with text "${text}" was not removed within ${timeout}ms`);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}

/**
 * Simulates user typing in an input field
 * 
 * @param input - The input element
 * @param value - The value to type
 */
export function typeInInput(input: HTMLInputElement, value: string): void {
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Simulates a form submission
 * 
 * @param form - The form element
 */
export function submitForm(form: HTMLFormElement): void {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

/**
 * Checks if an input has a validation error
 * 
 * @param container - The container element to search within
 * @param inputLabel - The label text of the input
 * @returns True if the input has an error, false otherwise
 */
export function hasValidationError(
    container: HTMLElement,
    inputLabel: string | RegExp
): boolean {
    // Look for aria-invalid attribute or error message near the input
    const inputs = container.querySelectorAll("input");

    for (const input of inputs) {
        const label = input.labels?.[0]?.textContent;
        const labelMatches = typeof inputLabel === "string"
            ? label?.includes(inputLabel)
            : label && inputLabel.test(label);

        if (labelMatches) {
            // Check for aria-invalid
            if (input.getAttribute("aria-invalid") === "true") {
                return true;
            }

            // Check for error message nearby
            const parent = input.closest("div");
            if (parent?.textContent?.toLowerCase().includes("error")) {
                return true;
            }
        }
    }

    return false;
}
