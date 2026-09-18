/**
 * Categorias e mensagens alinhadas à semântica HTTP (MDN).
 * @see https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Status
 */

export type HttpStatusCategory =
  | 'informational'
  | 'successful'
  | 'redirection'
  | 'client_error'
  | 'server_error'
  | 'unknown';

export function httpStatusCategory(status: number): HttpStatusCategory {
  if (status >= 100 && status <= 199) return 'informational';
  if (status >= 200 && status <= 299) return 'successful';
  if (status >= 300 && status <= 399) return 'redirection';
  if (status >= 400 && status <= 499) return 'client_error';
  if (status >= 500 && status <= 599) return 'server_error';
  return 'unknown';
}

const API_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida. Verifique os dados enviados.',
  404: 'Recurso não encontrado.',
  422: 'Não foi possível processar os dados enviados.',
  429: 'Muitas requisições. Aguarde um momento e tente novamente.',
  500: 'Erro interno no servidor. Tente novamente mais tarde.',
  503: 'Serviço temporariamente indisponível.',
};

export function messageForHttpStatus(status: number, fallback?: string): string {
  if (API_MESSAGES[status]) return API_MESSAGES[status];

  const category = httpStatusCategory(status);
  if (category === 'client_error') {
    return fallback ?? 'Não foi possível completar a operação.';
  }
  if (category === 'server_error') {
    return fallback ?? 'Falha no servidor. Tente novamente mais tarde.';
  }

  return fallback ?? 'Ocorreu um erro na comunicação com a API.';
}

/** Remove query string (pode conter busca com dados pessoais) antes de logar no console. */
export function safeClientLogPath(url: string): string {
  const pathOnly = url.split('?')[0]?.trim() ?? '';
  if (!pathOnly) return '/';
  return pathOnly.length > 120 ? `${pathOnly.slice(0, 120)}…` : pathOnly;
}

export function logHttpClientError(
  method: string,
  url: string,
  status: number,
  requestId?: string,
): void {
  if (!import.meta.env.DEV) return;

  const category = httpStatusCategory(status);
  const payload = {
    event: 'http.client_error',
    method,
    path: safeClientLogPath(url),
    status,
    category,
    request_id: requestId,
  };

  if (category === 'server_error') {
    console.error('[V-Lab API]', payload);
  } else {
    console.warn('[V-Lab API]', payload);
  }
}
