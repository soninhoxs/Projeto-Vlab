import axios, { isAxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { logHttpClientError, messageForHttpStatus } from '../utils/httpStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export type ApiClientError = Error & {
  status?: number;
  requestId?: string;
  validationErrors?: Record<string, string[]>;
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
});

export function stripContentTypeOnSafeRequests(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const method = (config.method ?? 'get').toLowerCase();
  if (method === 'get' || method === 'head' || method === 'options') {
    config.headers.delete('Content-Type');
  } else if (!config.headers.get('Content-Type')) {
    config.headers.set('Content-Type', 'application/json');
  }

  return config;
}

api.interceptors.request.use(stripContentTypeOnSafeRequests);

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

    const payload = typeof data === 'object' && data !== null ? data as Record<string, unknown> : {};
    const apiMessage =
      'message' in payload ? String(payload.message ?? '') : '';

    const validationErrors =
      'errors' in payload && payload.errors && typeof payload.errors === 'object'
        ? (payload.errors as Record<string, string[]>)
        : undefined;

    const message = apiMessage || messageForHttpStatus(status);
    const enriched = new Error(message) as ApiClientError;
    enriched.status = status;
    enriched.requestId = requestId;
    if (validationErrors) {
      enriched.validationErrors = validationErrors;
    }

    return Promise.reject(enriched);
  },
);

export function sanitizeSearch(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 100);
}

export function resolveApiErrorMessage(
  error: unknown,
  fallback = 'Erro ao processar requisição. Tente novamente.',
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'errors' in data) {
      const firstError = Object.values((data as { errors: Record<string, string[]> }).errors)[0];
      if (Array.isArray(firstError) && firstError[0]) {
        return firstError[0];
      }
    }

    if (data && typeof data === 'object' && 'message' in data) {
      const message = String((data as { message?: unknown }).message ?? '');
      if (message) return message;
    }

    if (error.code === 'ECONNABORTED') {
      return 'A requisição demorou demais. Aguarde a fila terminar de carregar e tente novamente.';
    }

    if (error.response?.status) {
      return messageForHttpStatus(error.response.status);
    }
  }

  if (error instanceof Error) {
    const clientError = error as ApiClientError;
    if (clientError.validationErrors) {
      const firstError = Object.values(clientError.validationErrors)[0];
      if (Array.isArray(firstError) && firstError[0]) {
        return firstError[0];
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}
