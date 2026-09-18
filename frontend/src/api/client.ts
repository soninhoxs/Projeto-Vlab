import axios, { isAxiosError } from 'axios';
import { logHttpClientError, messageForHttpStatus } from '../utils/httpStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!isAxiosError(error) || !error.response) {
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const requestId = error.response.headers['x-request-id'] as string | undefined;
    const method = error.config?.method?.toUpperCase() ?? 'GET';
    const url = error.config?.url ?? '';

    logHttpClientError(method, url, status, requestId);

    const apiMessage =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: unknown }).message ?? '')
        : '';

    const message = apiMessage || messageForHttpStatus(status);
    const enriched = new Error(message);
    (enriched as Error & { status?: number; requestId?: string }).status = status;
    (enriched as Error & { status?: number; requestId?: string }).requestId = requestId;

    return Promise.reject(enriched);
  },
);

export function sanitizeSearch(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 100);
}
