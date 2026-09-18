import { useState, useMemo, useEffect } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Filtros, Solicitacao, PaginationData } from '../types';
import { DEFAULT_FILTROS } from '../types';
import { useDebouncedValue } from './useDebouncedValue';
import {
  fetchSolicitacoes,
  getSolicitacoesQueryKey,
  ITEMS_PER_PAGE,
  type AppliedFiltros,
} from '../api/solicitacoes';
import { validatePeriod } from '../utils/date';

const STALE_TIME_MS = 30_000;

const mapApiItem = (item: Record<string, unknown>): Solicitacao => {
  let dataCriacao = item.dataCriacao as string | undefined;
  let horaCriacao = item.horaCriacao as string | undefined;

  if (!dataCriacao && typeof item.created_at === 'string') {
    try {
      const date = new Date(item.created_at);
      dataCriacao = date.toLocaleDateString('pt-BR');
      horaCriacao = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      dataCriacao = '17/09/2026';
      horaCriacao = '08:00';
    }
  }

  return {
    id: item.id as number | undefined,
    protocolo: String(item.protocolo ?? ''),
    nome: String(item.nome ?? item.nome_solicitante ?? 'Não informado'),
    nome_solicitante: item.nome_solicitante as string | undefined,
    cartaoSus: typeof item.cartaoSus === 'string' ? item.cartaoSus : (typeof item.cartao_sus === 'string' ? item.cartao_sus : undefined),
    cartao_sus: typeof item.cartao_sus === 'string' ? item.cartao_sus : undefined,
    categoria: item.categoria as Solicitacao['categoria'],
    prioridade: item.prioridade as Solicitacao['prioridade'],
    status: item.status as Solicitacao['status'],
    dataCriacao: dataCriacao || '17/09/2026',
    horaCriacao: horaCriacao || '08:00',
    created_at: item.created_at as string | undefined,
    updated_at: item.updated_at as string | undefined,
    descricao: item.descricao as string | null | undefined,
    justificativa_prioridade: item.justificativa_prioridade as string | null | undefined,
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

  const { data: apiResponse, isLoading, isFetching, isError, isPlaceholderData } = useQuery({
    queryKey,
    queryFn: () => fetchSolicitacoes(appliedFiltros, currentPage),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_MS,
    retry: 1,
    enabled: periodValidation.valid,
  });

  const totalPages = apiResponse?.last_page || 1;

  useEffect(() => {
    const pagesToPrefetch = [currentPage - 1, currentPage + 1].filter(
      (page) => page >= 1 && page <= totalPages,
    );

    pagesToPrefetch.forEach((page) => {
      if (!periodValidation.valid) return;

      queryClient.prefetchQuery({
        queryKey: getSolicitacoesQueryKey(appliedFiltros, page),
        queryFn: () => fetchSolicitacoes(appliedFiltros, page),
        staleTime: STALE_TIME_MS,
      });
    });
  }, [appliedFiltros, currentPage, totalPages, queryClient, periodValidation.valid]);

  const currentData: Solicitacao[] = useMemo(() => {
    if (apiResponse?.data && Array.isArray(apiResponse.data)) {
      return apiResponse.data.map((item) => mapApiItem(item as Record<string, unknown>));
    }

    return [];
  }, [apiResponse]);

  const kpis = useMemo(() => {
    if (apiResponse?.summary) {
      return {
        total: apiResponse.summary.total,
        recebidas: apiResponse.summary.recebidas,
        emAnalise: apiResponse.summary.em_analise,
        agendadas: apiResponse.summary.agendadas,
        urgentes: apiResponse.summary.urgentes,
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

  const totalItems = apiResponse?.total || 0;

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
    kpis,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    isSearchPending: filtros.busca !== debouncedBusca,
    periodoError: periodValidation.valid ? null : periodValidation.message,
  };
};
