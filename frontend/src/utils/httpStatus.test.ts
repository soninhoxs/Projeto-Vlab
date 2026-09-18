import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  httpStatusCategory,
  logHttpClientError,
  messageForHttpStatus,
  safeClientLogPath,
} from './httpStatus';

describe('httpStatusCategory', () => {
  it('should classify status codes using MDN range semantics', () => {
    expect(httpStatusCategory(200)).toBe('successful');
    expect(httpStatusCategory(422)).toBe('client_error');
    expect(httpStatusCategory(503)).toBe('server_error');
    expect(httpStatusCategory(99)).toBe('unknown');
  });
});

describe('messageForHttpStatus', () => {
  it('should return user-facing API messages for known error codes', () => {
    expect(messageForHttpStatus(404)).toContain('encontrado');
    expect(messageForHttpStatus(429)).toContain('Muitas');
  });

  it('should fall back to client-error copy when code is unknown in 4xx range', () => {
    expect(messageForHttpStatus(418)).toBe('Não foi possível completar a operação.');
  });

  it('should use custom fallback for non-error status families', () => {
    expect(messageForHttpStatus(102, 'Aguardando')).toBe('Aguardando');
  });
});

describe('safeClientLogPath', () => {
  it('should strip query strings that may contain personal search terms', () => {
    expect(safeClientLogPath('/solicitacoes?busca=Maria')).toBe('/solicitacoes');
  });

  it('should truncate very long paths', () => {
    const long = `/${'a'.repeat(200)}`;
    expect(safeClientLogPath(long).endsWith('…')).toBe(true);
  });
});

describe('logHttpClientError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should log client errors with warn and without query string in dev', () => {
    vi.stubEnv('DEV', true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logHttpClientError('GET', '/solicitacoes?busca=teste', 404, 'req-1');

    expect(warn).toHaveBeenCalledOnce();
    const payload = warn.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.path).toBe('/solicitacoes');
    expect(payload.status).toBe(404);
  });

  it('should log server errors with error level in dev', () => {
    vi.stubEnv('DEV', true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logHttpClientError('GET', '/solicitacoes', 500);

    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('should not log anything outside dev environment', () => {
    vi.stubEnv('DEV', false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logHttpClientError('GET', '/solicitacoes', 500);

    expect(warn).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
