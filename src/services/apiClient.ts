import axios, { AxiosError } from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the auth token to headers
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle expired/invalid auth tokens gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const isAuthRoute = requestUrl.includes("/api/auth/");

    if (status === 401 && !isAuthRoute && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getData = async <T = any>(
  url: string,
  params: Record<string, unknown> = {},
): Promise<T> => {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postData = async <T = any>(
  url: string,
  data: unknown = {},
): Promise<T> => {
  const response = await apiClient.post<T>(url, data);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const putData = async <T = any>(
  url: string,
  data: unknown = {},
): Promise<T> => {
  const response = await apiClient.put<T>(url, data);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const patchData = async <T = any>(
  url: string,
  data: unknown = {},
): Promise<T> => {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteData = async <T = any>(url: string): Promise<T> => {
  const response = await apiClient.delete<T>(url);
  return response.data;
};

export default apiClient;
