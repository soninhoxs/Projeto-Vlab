import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  QUERY_PERSIST_KEY,
  QUERY_PERSIST_VERSION,
  isBlockingQueryFailure,
  persistQueryCache,
  restoreQueryCache,
} from './queryClient';

describe('queryClient persist', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('restores successful queries from sessionStorage', async () => {
    const source = new QueryClient();
    source.setQueryData(['solicitacoes', 'page', 1], { total: 30, data: [{ id: 1 }] });

    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    };

    vi.useFakeTimers();
    persistQueryCache(source, storage);
    source.setQueryData(['solicitacoes', 'page', 1], { total: 30, data: [{ id: 1 }] });
    await vi.advanceTimersByTimeAsync(300);

    expect(memory.get(QUERY_PERSIST_KEY)).toContain('"v":' + QUERY_PERSIST_VERSION);

    const restored = new QueryClient();
    restoreQueryCache(restored, storage);

    expect(restored.getQueryData(['solicitacoes', 'page', 1])).toEqual({
      total: 30,
      data: [{ id: 1 }],
    });
  });

  it('ignores a persisted payload with the wrong version', () => {
    sessionStorage.setItem(
      QUERY_PERSIST_KEY,
      JSON.stringify({ v: 999, client: { queries: [], mutations: [] } }),
    );

    const queryClient = new QueryClient();
    restoreQueryCache(queryClient);

    expect(sessionStorage.getItem(QUERY_PERSIST_KEY)).toBeNull();
  });
});

describe('isBlockingQueryFailure', () => {
  it('keeps the dashboard usable when a background revalidation fails', () => {
    expect(isBlockingQueryFailure(true, true)).toBe(false);
    expect(isBlockingQueryFailure(true, false)).toBe(true);
    expect(isBlockingQueryFailure(false, true)).toBe(false);
  });
});
