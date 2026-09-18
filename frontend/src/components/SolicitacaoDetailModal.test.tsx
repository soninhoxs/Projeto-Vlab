import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SolicitacaoDetailModal } from './SolicitacaoDetailModal';
import type { Solicitacao } from '../types';

const { mockState, updateStatus, refetch } = vi.hoisted(() => ({
  mockState: {
    solicitacao: null as Solicitacao | null,
  },
  updateStatus: vi.fn(),
  refetch: vi.fn(),
}));

const baseSolicitacao: Solicitacao = {
  id: 7,
  protocolo: 'ABC1234567',
  nome: 'Ana Souza',
  nome_solicitante: 'Ana Souza',
  categoria: 'CONSULTA',
  prioridade: 'MEDIA',
  status: 'RECEBIDA',
  created_at: '2026-09-18T12:00:00.000000Z',
  historico_status: [
    { from_status: null, to_status: 'RECEBIDA', created_at: '2026-09-18T12:00:00.000000Z' },
  ],
};

vi.mock('../hooks/useSolicitacao', () => ({
  useSolicitacao: () => ({
    solicitacao: mockState.solicitacao,
    isLoading: false,
    isError: false,
    refetch,
  }),
}));

vi.mock('../hooks/useSolicitacoesMutations', async () => {
  const actual = await vi.importActual<typeof import('../hooks/useSolicitacoesMutations')>(
    '../hooks/useSolicitacoesMutations',
  );

  return {
    ...actual,
    useSolicitacoesMutations: () => ({
      updateStatus,
      isUpdatingStatus: false,
      updateStatusError: null,
      isUpdateStatusSuccess: false,
      getErrorMessage: () => 'Erro',
      resetUpdateStatus: vi.fn(),
    }),
  };
});

describe('SolicitacaoDetailModal', () => {
  it('shows only legal transitions and the status timeline', () => {
    mockState.solicitacao = baseSolicitacao;

    render(<SolicitacaoDetailModal isOpen onClose={() => undefined} solicitacaoId={7} />);

    expect(screen.getByRole('button', { name: /em análise/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelada/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^agendada$/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/histórico de status/i)).toBeInTheDocument();
    expect(screen.getAllByText('Recebida').length).toBeGreaterThan(0);
  });

  it('hides transition actions for a terminal status', () => {
    mockState.solicitacao = {
      ...baseSolicitacao,
      status: 'CONCLUIDA',
      historico_status: [
        { from_status: null, to_status: 'RECEBIDA', created_at: '2026-09-18T12:00:00.000000Z' },
        { from_status: 'AGENDADA', to_status: 'CONCLUIDA', created_at: '2026-09-18T13:00:00.000000Z' },
      ],
    };

    render(<SolicitacaoDetailModal isOpen onClose={() => undefined} solicitacaoId={7} />);

    expect(screen.queryByText(/alterar status/i)).not.toBeInTheDocument();
    expect(screen.getByText(/status final/i)).toBeInTheDocument();
    expect(screen.getByText(/agendada → concluída/i)).toBeInTheDocument();
  });
});
