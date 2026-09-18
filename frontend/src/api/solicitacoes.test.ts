import { describe, expect, it } from 'vitest';
import {
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
