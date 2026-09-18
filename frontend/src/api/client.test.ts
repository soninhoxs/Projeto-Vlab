import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { resolveApiErrorMessage, stripContentTypeOnSafeRequests, type ApiClientError } from './client';

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
