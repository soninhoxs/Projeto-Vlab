import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';

export const QUERY_STALE_TIME_MS = 30_000;
export const QUERY_REVALIDATE_INTERVAL_MS = 45_000;
export const QUERY_GC_TIME_MS = 10 * 60_000;
export const QUERY_PERSIST_KEY = 'vlab-query-cache';
export const QUERY_PERSIST_VERSION = 1;

type PersistedQueryCache = {
  v: number;
  client: ReturnType<typeof dehydrate>;
};

export function createAppQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        retry: 2,
      },
    },
  });

  restoreQueryCache(queryClient);
  persistQueryCache(queryClient);

  return queryClient;
}

export function restoreQueryCache(
  queryClient: QueryClient,
  storage: Pick<Storage, 'getItem' | 'removeItem'> | null = defaultStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    const raw = storage.getItem(QUERY_PERSIST_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as PersistedQueryCache;
    if (parsed.v !== QUERY_PERSIST_VERSION || !parsed.client) {
      storage.removeItem(QUERY_PERSIST_KEY);
      return;
    }

    hydrate(queryClient, parsed.client);
  } catch {
    storage.removeItem(QUERY_PERSIST_KEY);
  }
}

export function persistQueryCache(
  queryClient: QueryClient,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | null = defaultStorage(),
): () => void {
  if (!storage) {
    return () => undefined;
  }

  let timeoutId = 0;

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      try {
        const payload: PersistedQueryCache = {
          v: QUERY_PERSIST_VERSION,
          client: dehydrate(queryClient, {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          }),
        };
        storage.setItem(QUERY_PERSIST_KEY, JSON.stringify(payload));
      } catch {
        storage.removeItem(QUERY_PERSIST_KEY);
      }
    }, 250);
  });

  return () => {
    window.clearTimeout(timeoutId);
    unsubscribe();
  };
}

function defaultStorage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function isBlockingQueryFailure(isError: boolean, hasData: boolean): boolean {
  return isError && !hasData;
}
