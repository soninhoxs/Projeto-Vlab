import { describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { enrichApiError, resolveApiErrorMessage, stripContentTypeOnSafeRequests, type ApiClientError } from './client';

describe('stripContentTypeOnSafeRequests', () => {
  it('removes JSON content-type from GET so the browser skips CORS preflight', () => {
    const config = {
      method: 'get',
      headers: new AxiosHeaders({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    } as InternalAxiosRequestConfig;

    stripContentTypeOnSafeRequests(config);

    expect(config.headers.get('Content-Type')).toBeFalsy();
    expect(config.headers.get('Accept')).toBe('application/json');
  });

  it('keeps JSON content-type on POST', () => {
    const config = {
      method: 'post',
      headers: new AxiosHeaders({ Accept: 'application/json' }),
    } as InternalAxiosRequestConfig;

    stripContentTypeOnSafeRequests(config);

    expect(config.headers.get('Content-Type')).toBe('application/json');
  });
});

describe('enrichApiError', () => {
  it('turns a network failure into a user-facing message and a structured log', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const axiosError = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      { url: '/solicitacoes?busca=Maria', method: 'get', headers: new AxiosHeaders() },
    );

    await expect(enrichApiError(axiosError)).rejects.toThrow(
      'Não foi possível conectar à API',
    );

    expect(errorSpy).toHaveBeenCalledOnce();
    const payload = errorSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.event).toBe('integration.failed');
    expect(payload.reason).toBe('network');
    expect(payload.path).toBe('/solicitacoes');
    errorSpy.mockRestore();
  });

  it('leaves aborted requests untouched', async () => {
    const axiosError = new AxiosError('canceled', 'ERR_CANCELED');

    await expect(enrichApiError(axiosError)).rejects.toBe(axiosError);
  });
});

describe('resolveApiErrorMessage', () => {
  it('reads validation errors from enriched client errors', () => {
    const error = new Error('The nome solicitante field is required.') as ApiClientError;
    error.validationErrors = {
      nome_solicitante: ['O nome deve ter no mínimo 3 caracteres.'],
    };

    expect(resolveApiErrorMessage(error)).toBe('O nome deve ter no mínimo 3 caracteres.');
  });

  it('falls back to the error message from the API interceptor', () => {
    const error = new Error('Muitas requisições. Aguarde um momento e tente novamente.');

    expect(resolveApiErrorMessage(error)).toBe(
      'Muitas requisições. Aguarde um momento e tente novamente.',
    );
  });

  it('reads validation errors from raw axios responses', () => {
    const axiosError = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 422,
        statusText: 'Unprocessable Content',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {
          message: 'The nome solicitante field is required.',
          errors: {
            nome_solicitante: ['Nome do solicitante é obrigatório'],
          },
        },
      },
    );

    expect(resolveApiErrorMessage(axiosError)).toBe('Nome do solicitante é obrigatório');
  });
});
