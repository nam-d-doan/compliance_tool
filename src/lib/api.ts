// API client with base functionality

// Endpoint constants already include the '/api' prefix (e.g. '/api/auth/login'),
// so the base URL must be empty (same-origin relative) to avoid double '/api/api/...'.
// In production with a real backend on a different origin, set VITE_API_URL to that
// origin and strip the '/api' prefix from the endpoint constants.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Default headers
    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    // Get auth token from store if available
    // In a real implementation, you might inject the token from a context
    const authStore = localStorage.getItem("auth-storage");
    let token = null;
    if (authStore) {
      try {
        const authData = JSON.parse(authStore);
        token = authData.state?.token;
      } catch (e) {
        console.warn("Failed to parse auth data from localStorage");
      }
    }

    if (token) {
      (defaultHeaders as Record<string, string>)["Authorization"] =
        `Bearer ${token}`;
    }

    // Merge with provided headers
    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`,
      );
    }

    // Parse and return response
    return response.json();
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // File upload method
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    // Get auth token
    const authStore = localStorage.getItem("auth-storage");
    let token = null;
    if (authStore) {
      try {
        const authData = JSON.parse(authStore);
        token = authData.state?.token;
      } catch (e) {
        console.warn("Failed to parse auth data from localStorage");
      }
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // FormData shouldn't have Content-Type header set (browser does it automatically)
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Upload failed with status ${response.status}`,
      );
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Convenience typed helpers
export const apiGet = <T>(endpoint: string): Promise<T> =>
  apiClient.get<T>(endpoint);
export const apiPost = <T>(endpoint: string, data: unknown): Promise<T> =>
  apiClient.post<T>(endpoint, data);
export const apiPut = <T>(endpoint: string, data: unknown): Promise<T> =>
  apiClient.put<T>(endpoint, data);
export const apiPatch = <T>(endpoint: string, data: unknown): Promise<T> =>
  apiClient.patch<T>(endpoint, data);
export const apiDelete = <T>(endpoint: string): Promise<T> =>
  apiClient.delete<T>(endpoint);
export const apiUpload = <T>(
  endpoint: string,
  formData: FormData,
): Promise<T> => apiClient.upload<T>(endpoint, formData);
