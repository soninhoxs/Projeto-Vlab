import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Filtros, Solicitacao, PaginationData } from '../types';
import { DEFAULT_FILTROS } from '../types';
import { useDebouncedValue } from './useDebouncedValue';
import {
  deriveSolicitacoesFromCache,
  fetchSolicitacoes,
  getSolicitacoesQueryKey,
  ITEMS_PER_PAGE,
  type AppliedFiltros,
  type SolicitacoesSummary,
} from '../api/solicitacoes';
import { parseApiDate, validatePeriod } from '../utils/date';
import { QUERY_STALE_TIME_MS, isBlockingQueryFailure } from '../api/queryClient';

const STALE_TIME_MS = QUERY_STALE_TIME_MS;

const mapApiItem = (item: Record<string, unknown>): Solicitacao => {
  let dataCriacao = item.dataCriacao as string | undefined;
  let horaCriacao = item.horaCriacao as string | undefined;
  const parsedCreatedAt = parseApiDate(item.created_at ?? item.dataCriacao);

  if (!dataCriacao && parsedCreatedAt) {
    dataCriacao = parsedCreatedAt.toLocaleDateString('pt-BR');
    horaCriacao = parsedCreatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return {
    id: item.id as number | undefined,
    protocolo: String(item.protocolo ?? ''),
    nome: String(item.nome ?? item.nome_solicitante ?? 'Não informado'),
    nome_solicitante: item.nome_solicitante as string | undefined,
    categoria: item.categoria as Solicitacao['categoria'],
    prioridade: item.prioridade as Solicitacao['prioridade'],
    status: item.status as Solicitacao['status'],
    dataCriacao: dataCriacao || '—',
    horaCriacao: horaCriacao || '',
    created_at: parsedCreatedAt?.toISOString() ?? (typeof item.created_at === 'string' ? item.created_at : undefined),
    updated_at: item.updated_at as string | undefined,
    descricao: item.descricao as string | null | undefined,
    justificativa_prioridade: item.justificativa_prioridade as string | null | undefined,
    historico_status: Array.isArray(item.historico_status)
      ? (item.historico_status as Solicitacao['historico_status'])
      : undefined,
  };
};

export const useSolicitacoes = () => {
  const queryClient = useQueryClient();

  const [filtros, setFiltros] = useState<Filtros>(DEFAULT_FILTROS);

  const [currentPage, setCurrentPage] = useState(1);
  const debouncedBusca = useDebouncedValue(filtros.busca, 300);

  const appliedFiltros: AppliedFiltros = useMemo(
    () => ({
      ...filtros,
      busca: debouncedBusca.trim(),
    }),
    [filtros, debouncedBusca],
  );

  const periodValidation = useMemo(
    () => validatePeriod(appliedFiltros.dataInicio, appliedFiltros.dataFim),
    [appliedFiltros.dataInicio, appliedFiltros.dataFim],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    appliedFiltros.categoria,
    appliedFiltros.prioridade,
    appliedFiltros.status,
    appliedFiltros.busca,
    appliedFiltros.dataInicio,
    appliedFiltros.dataFim,
  ]);

  const queryKey = getSolicitacoesQueryKey(appliedFiltros, currentPage);

  useEffect(() => {
    void queryClient.cancelQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          key[0] === 'solicitacoes'
          && Number(key[2]) !== Number(currentPage)
          && query.state.fetchStatus === 'fetching'
        );
      },
    });
  }, [currentPage, queryClient]);

  const {
    data: apiResponse,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    isPlaceholderData,
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const state = queryClient.getQueryState(queryKey);
      const hasStoredData = (state?.dataUpdatedAt ?? 0) > 0;

      if (!hasStoredData) {
        const fromCache = deriveSolicitacoesFromCache(queryClient, appliedFiltros, currentPage);
        if (fromCache) {
          return fromCache;
        }
      }

      return fetchSolicitacoes(appliedFiltros, currentPage, signal);
    },
    placeholderData: (previousData) => {
      const derived = deriveSolicitacoesFromCache(queryClient, appliedFiltros, currentPage);
      if (derived) {
        return derived;
      }

      if (previousData?.current_page === currentPage) {
        return previousData;
      }

      return undefined;
    },
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 0,
    enabled: periodValidation.valid,
  });

  const listMetaRef = useRef<{ lastPage: number; total: number; summary: SolicitacoesSummary | null }>({
    lastPage: 1,
    total: 0,
    summary: null,
  });

  if (apiResponse && !isPlaceholderData) {
    listMetaRef.current = {
      lastPage: Math.max(1, apiResponse.last_page || 1),
      total: apiResponse.total || 0,
      summary: apiResponse.summary ?? listMetaRef.current.summary,
    };
  }

  const totalPages = apiResponse?.last_page || listMetaRef.current.lastPage;

  const prefetchPage = useCallback(
    (page: number): Promise<unknown> => {
      if (!periodValidation.valid || page < 1 || page === currentPage) {
        return Promise.resolve();
      }
      if (totalPages > 1 && page > totalPages) {
        return Promise.resolve();
      }

      const key = getSolicitacoesQueryKey(appliedFiltros, page);
      if (queryClient.getQueryData(key)) {
        return Promise.resolve();
      }

      return queryClient.prefetchQuery({
        queryKey: key,
        queryFn: async ({ signal }) => {
          const fromCache = deriveSolicitacoesFromCache(queryClient, appliedFiltros, page);
          if (fromCache) {
            return fromCache;
          }

          return fetchSolicitacoes(appliedFiltros, page, signal);
        },
        staleTime: STALE_TIME_MS,
      });
    },
    [appliedFiltros, currentPage, periodValidation.valid, queryClient, totalPages],
  );

  const currentData: Solicitacao[] = useMemo(() => {
    if (apiResponse?.data && Array.isArray(apiResponse.data)) {
      return apiResponse.data.map((item) => mapApiItem(item as Record<string, unknown>));
    }

    return [];
  }, [apiResponse]);

  const kpis = useMemo(() => {
    const summary = apiResponse?.summary ?? listMetaRef.current.summary;
    if (summary) {
      return {
        total: summary.total,
        recebidas: summary.recebidas,
        emAnalise: summary.em_analise,
        agendadas: summary.agendadas,
        urgentes: summary.urgentes,
      };
    }

    return {
      total: apiResponse?.total ?? currentData.length,
      recebidas: currentData.filter((item) => item.status === 'RECEBIDA').length,
      emAnalise: currentData.filter((item) => item.status === 'EM_ANALISE' || item.status === 'EM ANÁLISE').length,
      agendadas: currentData.filter((item) => item.status === 'AGENDADA').length,
      urgentes: currentData.filter((item) => item.prioridade === 'URGENTE').length,
    };
  }, [apiResponse, currentData]);

  const totalItems = apiResponse?.total ?? listMetaRef.current.total;

  const generatePagesArray = (current: number, total: number) => {
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: number[] = [];
    let lastPage: number | undefined;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    for (const page of range) {
      if (lastPage) {
        if (page - lastPage === 2) {
          rangeWithDots.push(lastPage + 1);
        } else if (page - lastPage !== 1) {
          rangeWithDots.push(-1);
        }
      }
      rangeWithDots.push(page);
      lastPage = page;
    }

    return rangeWithDots;
  };

  const paginationData: PaginationData = {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: ITEMS_PER_PAGE,
    pages: generatePagesArray(currentPage, totalPages),
  };

  return {
    filtros,
    setFiltros,
    resetListToDefault: () => {
      setFiltros(DEFAULT_FILTROS);
      setCurrentPage(1);
    },
    currentData,
    paginationData,
    setCurrentPage,
    prefetchPage,
    kpis,
    isLoading,
    isFetching,
    isListRefreshing: isFetching && isPlaceholderData,
    isPlaceholderData,
    isError: isBlockingQueryFailure(isError, Boolean(apiResponse?.data)),
    isSearchPending: filtros.busca !== debouncedBusca,
    periodoError: periodValidation.valid ? null : periodValidation.message,
    loadErrorMessage:
      isError && queryError instanceof Error
        ? queryError.message
        : 'Não foi possível carregar as solicitações.',
  };
};
