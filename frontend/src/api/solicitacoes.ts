import type { QueryClient } from '@tanstack/react-query';
import { api, sanitizeSearch } from './client';
import type { Filtros } from '../types';

export const ITEMS_PER_PAGE = 7;
export const PREFETCH_AHEAD_PAGES = 3;

export interface SolicitacoesSummary {
  total: number;
  recebidas: number;
  em_analise: number;
  agendadas: number;
  urgentes: number;
}

export interface SolicitacoesApiResponse {
  data: Record<string, unknown>[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  summary?: SolicitacoesSummary;
}

export interface AppliedFiltros extends Filtros {}

export function buildSolicitacoesParams(filtros: AppliedFiltros, page: number): URLSearchParams {
  const params = new URLSearchParams();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  params.append('page', String(safePage));

  const busca = sanitizeSearch(filtros.busca);
  if (busca) params.append('busca', busca);
  if (filtros.categoria !== 'todas') params.append('categoria', filtros.categoria);
  if (filtros.prioridade !== 'todas') params.append('prioridade', filtros.prioridade);
  if (filtros.status !== 'todos') params.append('status', filtros.status);
  if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio);
  if (filtros.dataFim) params.append('data_fim', filtros.dataFim);

  return params;
}

export async function fetchSolicitacoes(
  filtros: AppliedFiltros,
  page: number,
): Promise<SolicitacoesApiResponse> {
  const params = buildSolicitacoesParams(filtros, page);
  const response = await api.get<SolicitacoesApiResponse>('/solicitacoes', { params });
  return response.data;
}

export function getSolicitacoesQueryKey(filtros: AppliedFiltros, page: number) {
  return ['solicitacoes', filtros, page] as const;
}

export function getNeighborPages(
  currentPage: number,
  totalPages: number,
  ahead = PREFETCH_AHEAD_PAGES,
): number[] {
  if (currentPage < 1 || totalPages < 2 || ahead < 1) {
    return [];
  }

  const pages: number[] = [];

  for (let offset = 1; offset <= ahead; offset += 1) {
    const next = currentPage + offset;
    if (next <= totalPages) {
      pages.push(next);
    }
  }

  const previous = currentPage - 1;
  if (previous >= 1) {
    pages.push(previous);
  }

  return pages;
}

export function matchesListFilters(item: Record<string, unknown>, filtros: AppliedFiltros): boolean {
  if (filtros.categoria !== 'todas' && item.categoria !== filtros.categoria) return false;
  if (filtros.prioridade !== 'todas' && item.prioridade !== filtros.prioridade) return false;
  if (filtros.status !== 'todos' && item.status !== filtros.status) return false;

  const busca = sanitizeSearch(filtros.busca).toLowerCase();
  if (busca) {
    const nome = String(item.nome_solicitante ?? item.nome ?? '').toLowerCase();
    const protocolo = String(item.protocolo ?? '').toLowerCase();
    if (!nome.includes(busca) && !protocolo.includes(busca)) return false;
  }

  if (filtros.dataInicio || filtros.dataFim) {
    const created = typeof item.created_at === 'string' ? item.created_at.slice(0, 10) : '';
    if (created) {
      if (filtros.dataInicio && created < filtros.dataInicio) return false;
      if (filtros.dataFim && created > filtros.dataFim) return false;
    }
  }

  return true;
}

export function insertCreatedIntoList(
  current: SolicitacoesApiResponse | undefined,
  created: Record<string, unknown>,
): SolicitacoesApiResponse | undefined {
  if (!current) return current;

  const alreadyListed = current.data.some(
    (item) => item.id === created.id || item.protocolo === created.protocolo,
  );
  if (alreadyListed) return current;

  const nextTotal = current.total + 1;
  const perPage = current.per_page || ITEMS_PER_PAGE;
  const status = String(created.status ?? 'RECEBIDA');
  const prioridade = String(created.prioridade ?? '');

  return {
    ...current,
    data: [created, ...current.data].slice(0, perPage),
    total: nextTotal,
    last_page: Math.max(1, Math.ceil(nextTotal / perPage)),
    summary: current.summary
      ? {
          ...current.summary,
          total: current.summary.total + 1,
          recebidas: status === 'RECEBIDA' ? current.summary.recebidas + 1 : current.summary.recebidas,
          urgentes: prioridade === 'URGENTE' ? current.summary.urgentes + 1 : current.summary.urgentes,
        }
      : current.summary,
  };
}

export function writeCreatedSolicitacaoToCache(
  queryClient: QueryClient,
  created: Record<string, unknown>,
): void {
  const entries = queryClient.getQueriesData<SolicitacoesApiResponse>({ queryKey: ['solicitacoes'] });

  entries.forEach(([queryKey, current]) => {
    if (!current || !Array.isArray(queryKey)) return;

    const filtros = queryKey[1] as AppliedFiltros | undefined;
    const page = queryKey[2];
    if (page !== 1 || !filtros || !matchesListFilters(created, filtros)) return;

    queryClient.setQueryData(queryKey, insertCreatedIntoList(current, created));
  });
}
