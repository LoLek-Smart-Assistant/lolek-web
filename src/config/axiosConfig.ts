import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const viteEnv = (import.meta as unknown as {
  env?: { VITE_API_URL?: string; DEV?: boolean }
}).env;
const API_BASE_URL = viteEnv?.VITE_API_URL || 'http://localhost:3000';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
  withCredentials: true,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
};

let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (value?: unknown) => void
  reject: (error: unknown) => void
}> = [];

function flushPendingRequests(error: unknown) {
  pendingRequests.forEach((request) => {
    if (error) {
      request.reject(error)
    } else {
      request.resolve()
    }
  })
  pendingRequests = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (viteEnv?.DEV) {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';
    const isAuthRoute =
      requestUrl.includes('/authentication/refresh') ||
      requestUrl.includes('/authentication/log-in') ||
      requestUrl.includes('/authentication/sign-in') ||
      requestUrl.includes('/authentication/log-out');

    if (!originalRequest || status !== 401 || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject })
      }).then(() => axiosInstance(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshClient.post('/authentication/refresh');
      flushPendingRequests(null);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      flushPendingRequests(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
