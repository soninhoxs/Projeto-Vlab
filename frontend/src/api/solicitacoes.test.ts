import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import {
  canAnswerFromCachedFiltros,
  deriveSolicitacoesFromCache,
  getNeighborPages,
  getSolicitacoesQueryKey,
  insertCreatedIntoList,
  matchesListFilters,
  type SolicitacoesApiResponse,
} from './solicitacoes';
import { DEFAULT_FILTROS } from '../types';

const created = {
  id: 99,
  protocolo: 'ABC1234567',
  nome_solicitante: 'Ana Souza',
  categoria: 'CONSULTA',
  prioridade: 'BAIXA',
  status: 'RECEBIDA',
  created_at: '2026-09-17T20:00:00.000000Z',
};

const list: SolicitacoesApiResponse = {
  data: [{ id: 1, protocolo: 'OLD0000001', nome_solicitante: 'João' }],
  current_page: 1,
  last_page: 1,
  total: 1,
  per_page: 7,
  summary: {
    total: 1,
    recebidas: 1,
    em_analise: 0,
    agendadas: 0,
    urgentes: 0,
  },
};

describe('getNeighborPages', () => {
  it('prefetches the next page from the first page', () => {
    expect(getNeighborPages(1, 5)).toEqual([2]);
  });

  it('includes the previous page after the next page', () => {
    expect(getNeighborPages(3, 8)).toEqual([4, 2]);
  });

  it('stops at the last page', () => {
    expect(getNeighborPages(4, 5)).toEqual([5, 3]);
  });

  it('returns an empty list when there is only one page', () => {
    expect(getNeighborPages(1, 1)).toEqual([]);
  });
});

describe('solicitacoes cache helpers', () => {
  it('matches default filters', () => {
    expect(matchesListFilters(created, DEFAULT_FILTROS)).toBe(true);
  });

  it('excludes items that do not match a status filter', () => {
    expect(matchesListFilters(created, { ...DEFAULT_FILTROS, status: 'AGENDADA' })).toBe(false);
  });

  it('inserts the created item at the top of page 1', () => {
    const next = insertCreatedIntoList(list, created);

    expect(next?.data[0].id).toBe(99);
    expect(next?.total).toBe(2);
    expect(next?.summary?.total).toBe(2);
    expect(next?.summary?.recebidas).toBe(2);
  });

  it('does not duplicate an already listed item', () => {
    const withCreated = insertCreatedIntoList(list, created);
    const again = insertCreatedIntoList(withCreated, created);

    expect(again?.data.filter((item) => item.id === 99)).toHaveLength(1);
    expect(again?.total).toBe(2);
  });
});

describe('deriveSolicitacoesFromCache', () => {
  it('answers a narrower status filter from a complete unfiltered page', () => {
    const queryClient = new QueryClient();
    const unfiltered = {
      ...list,
      data: [
        { ...created, id: 1, status: 'RECEBIDA', categoria: 'CONSULTA', prioridade: 'BAIXA' },
        { ...created, id: 2, protocolo: 'EMANALISE01', status: 'EM_ANALISE', categoria: 'OUTRO', prioridade: 'MEDIA' },
      ],
      total: 2,
      summary: {
        total: 2,
        recebidas: 1,
        em_analise: 1,
        agendadas: 0,
        urgentes: 0,
      },
    };

    queryClient.setQueryData(getSolicitacoesQueryKey(DEFAULT_FILTROS, 1), unfiltered);

    const derived = deriveSolicitacoesFromCache(
      queryClient,
      { ...DEFAULT_FILTROS, status: 'EM_ANALISE' },
      1,
    );

    expect(derived?.total).toBe(1);
    expect(derived?.data).toHaveLength(1);
    expect(derived?.data[0].id).toBe(2);
    expect(derived?.summary?.em_analise).toBe(1);
    expect(derived?.summary?.recebidas).toBe(0);
  });

  it('does not derive when a paginated cache is incomplete', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(getSolicitacoesQueryKey(DEFAULT_FILTROS, 1), {
      ...list,
      last_page: 3,
      total: 20,
    });

    expect(
      deriveSolicitacoesFromCache(
        queryClient,
        { ...DEFAULT_FILTROS, status: 'RECEBIDA' },
        1,
      ),
    ).toBeUndefined();
  });

  it('does not treat a narrower cache as a source for a wider filter', () => {
    expect(
      canAnswerFromCachedFiltros(
        { ...DEFAULT_FILTROS, status: 'EM_ANALISE' },
        DEFAULT_FILTROS,
      ),
    ).toBe(false);
    expect(canAnswerFromCachedFiltros(DEFAULT_FILTROS, { ...DEFAULT_FILTROS, status: 'EM_ANALISE' })).toBe(true);
    expect(canAnswerFromCachedFiltros(DEFAULT_FILTROS, DEFAULT_FILTROS)).toBe(false);
  });
});
