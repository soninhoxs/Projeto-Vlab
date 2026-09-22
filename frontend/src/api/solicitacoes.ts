import type { QueryClient } from '@tanstack/react-query';
import { api, sanitizeSearch } from './client';
import type { Filtros } from '../types';

export const ITEMS_PER_PAGE = 7;

const activeListControllers = new Set<AbortController>();

export function abortActiveListFetch(): void {
  for (const controller of activeListControllers) {
    controller.abort();
  }
  activeListControllers.clear();
}

export interface DiaTotal {
  data: string;
  total: number;
}

export interface SolicitacoesSummary {
  total: number;
  recebidas: number;
  em_analise: number;
  agendadas: number;
  urgentes: number;
  por_status?: Record<string, number>;
  por_categoria?: Record<string, number>;
  por_prioridade?: Record<string, number>;
  por_dia?: DiaTotal[];
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
  signal?: AbortSignal,
): Promise<SolicitacoesApiResponse> {
  const controller = new AbortController();
  activeListControllers.add(controller);

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const params = buildSolicitacoesParams(filtros, page);
    const response = await api.get<SolicitacoesApiResponse>('/solicitacoes', {
      params,
      signal: controller.signal,
    });
    return response.data;
  } finally {
    activeListControllers.delete(controller);
  }
}

export function getSolicitacoesQueryKey(filtros: AppliedFiltros, page: number) {
  return ['solicitacoes', filtros, page] as const;
}

export function getNeighborPages(
  currentPage: number,
  totalPages: number,
  ahead = 1,
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

export function canAnswerFromCachedFiltros(
  cached: AppliedFiltros,
  target: AppliedFiltros,
): boolean {
  if (filtrosCacheKey(cached) === filtrosCacheKey(target)) return false;
  if (cached.categoria !== 'todas' && cached.categoria !== target.categoria) return false;
  if (cached.prioridade !== 'todas' && cached.prioridade !== target.prioridade) return false;
  if (cached.status !== 'todos' && cached.status !== target.status) return false;

  const cachedBusca = sanitizeSearch(cached.busca).toLowerCase();
  const targetBusca = sanitizeSearch(target.busca).toLowerCase();
  if (cachedBusca && !targetBusca.includes(cachedBusca)) return false;

  if (cached.dataInicio && (!target.dataInicio || target.dataInicio < cached.dataInicio)) return false;
  if (cached.dataFim && (!target.dataFim || target.dataFim > cached.dataFim)) return false;

  return true;
}

function filtrosCacheKey(filtros: AppliedFiltros): string {
  return JSON.stringify({
    categoria: filtros.categoria,
    prioridade: filtros.prioridade,
    status: filtros.status,
    busca: sanitizeSearch(filtros.busca),
    dataInicio: filtros.dataInicio,
    dataFim: filtros.dataFim,
  });
}

const STATUS_KEYS = ['RECEBIDA', 'EM_ANALISE', 'AGENDADA', 'CONCLUIDA', 'CANCELADA'] as const;
const CATEGORIA_KEYS = ['CONSULTA', 'EXAME', 'VACINACAO', 'OUTRO'] as const;
const PRIORIDADE_KEYS = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'] as const;

const STATUS_ALIASES: Record<string, string> = {
  'EM ANÁLISE': 'EM_ANALISE',
  'CONCLUÍDA': 'CONCLUIDA',
};

const PRIORIDADE_ALIASES: Record<string, string> = {
  MÉDIA: 'MEDIA',
};

function countField(
  items: Record<string, unknown>[],
  field: string,
  keys: readonly string[],
  aliases: Record<string, string> = {},
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of keys) counts[key] = 0;

  for (const item of items) {
    const raw = String(item[field] ?? '');
    const key = aliases[raw] ?? raw;
    if (key in counts) counts[key] += 1;
  }

  return counts;
}

export function recentDaySeries(counts: Map<string, number>, days = 14, today = new Date()): DiaTotal[] {
  const series: DiaTotal[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
    const iso = date.toISOString().slice(0, 10);
    series.push({ data: iso, total: counts.get(iso) ?? 0 });
  }

  return series;
}

function dayCountsFromItems(items: Record<string, unknown>[]): DiaTotal[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const created = typeof item.created_at === 'string' ? item.created_at.slice(0, 10) : '';
    if (!created) continue;
    counts.set(created, (counts.get(created) ?? 0) + 1);
  }

  return recentDaySeries(counts);
}

function buildSummaryFromItems(items: Record<string, unknown>[]): SolicitacoesSummary {
  const porStatus = countField(items, 'status', STATUS_KEYS, STATUS_ALIASES);
  const porCategoria = countField(items, 'categoria', CATEGORIA_KEYS);
  const porPrioridade = countField(items, 'prioridade', PRIORIDADE_KEYS, PRIORIDADE_ALIASES);

  return {
    total: items.length,
    recebidas: porStatus.RECEBIDA,
    em_analise: porStatus.EM_ANALISE,
    agendadas: porStatus.AGENDADA,
    urgentes: porPrioridade.URGENTE,
    por_status: porStatus,
    por_categoria: porCategoria,
    por_prioridade: porPrioridade,
    por_dia: dayCountsFromItems(items),
  };
}

function bumpCount(map: Record<string, number> | undefined, key: string): Record<string, number> | undefined {
  if (!map || !(key in map)) return map;
  return { ...map, [key]: map[key] + 1 };
}

function bumpDay(days: DiaTotal[] | undefined, createdAt: unknown): DiaTotal[] | undefined {
  if (!days || typeof createdAt !== 'string') return days;
  const iso = createdAt.slice(0, 10);
  if (!days.some((day) => day.data === iso)) return days;

  return days.map((day) => (day.data === iso ? { ...day, total: day.total + 1 } : day));
}

function collectCompleteCachedRows(
  queryClient: QueryClient,
  cachedFiltros: AppliedFiltros,
): Record<string, unknown>[] | undefined {
  const pages = new Map<number, SolicitacoesApiResponse>();

  for (const [queryKey, current] of queryClient.getQueriesData<SolicitacoesApiResponse>({
    queryKey: ['solicitacoes'],
  })) {
    if (!current || !Array.isArray(queryKey)) continue;
    const filtros = queryKey[1] as AppliedFiltros | undefined;
    const page = queryKey[2];
    if (!filtros || typeof page !== 'number') continue;
    if (filtrosCacheKey(filtros) !== filtrosCacheKey(cachedFiltros)) continue;
    pages.set(page, current);
  }

  const firstPage = pages.get(1);
  if (!firstPage) return undefined;

  const lastPage = Math.max(1, firstPage.last_page || 1);
  const rows: Record<string, unknown>[] = [];

  for (let page = 1; page <= lastPage; page += 1) {
    const cachedPage = pages.get(page);
    if (!cachedPage) return undefined;
    rows.push(...cachedPage.data);
  }

  if (firstPage.total > 0 && rows.length === 0) return undefined;

  return rows;
}

export function paginateDerivedSolicitacoes(
  items: Record<string, unknown>[],
  page: number,
): SolicitacoesApiResponse {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE) || 1);
  const currentPage = Math.min(safePage, lastPage);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;

  return {
    data: items.slice(start, start + ITEMS_PER_PAGE),
    current_page: currentPage,
    last_page: lastPage,
    total,
    per_page: ITEMS_PER_PAGE,
    summary: buildSummaryFromItems(items),
  };
}

export function deriveSolicitacoesFromCache(
  queryClient: QueryClient,
  target: AppliedFiltros,
  page: number,
): SolicitacoesApiResponse | undefined {
  const seen = new Set<string>();
  let bestRows: Record<string, unknown>[] | undefined;

  for (const [queryKey, current] of queryClient.getQueriesData<SolicitacoesApiResponse>({
    queryKey: ['solicitacoes'],
  })) {
    if (!current || !Array.isArray(queryKey)) continue;
    const cachedFiltros = queryKey[1] as AppliedFiltros | undefined;
    if (!cachedFiltros || !canAnswerFromCachedFiltros(cachedFiltros, target)) continue;

    const groupKey = filtrosCacheKey(cachedFiltros);
    if (seen.has(groupKey)) continue;
    seen.add(groupKey);

    const rows = collectCompleteCachedRows(queryClient, cachedFiltros);
    if (!rows) continue;
    if (!bestRows || rows.length > bestRows.length) {
      bestRows = rows;
    }
  }

  if (!bestRows) return undefined;

  const filtered = bestRows.filter((item) => matchesListFilters(item, target));
  return paginateDerivedSolicitacoes(filtered, page);
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
          por_status: bumpCount(current.summary.por_status, status),
          por_categoria: bumpCount(current.summary.por_categoria, String(created.categoria ?? '')),
          por_prioridade: bumpCount(current.summary.por_prioridade, prioridade),
          por_dia: bumpDay(current.summary.por_dia, created.created_at),
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
