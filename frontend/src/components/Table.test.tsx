import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table } from './Table';
import type { Solicitacao } from '../types';

const row: Solicitacao = {
  id: 1,
  protocolo: 'ABC1234567',
  nome: 'Ana Souza',
  categoria: 'CONSULTA',
  prioridade: 'BAIXA',
  status: 'RECEBIDA',
  dataCriacao: '18/09/2026',
  horaCriacao: '12:00',
  created_at: '2026-09-18T12:00:00.000000Z',
};

describe('Table', () => {
  it('renders a loading state', () => {
    render(<Table data={[]} isLoading onViewDetails={() => undefined} />);

    expect(screen.getByText(/carregando solicitações/i)).toBeInTheDocument();
  });

  it('renders an empty state', () => {
    render(<Table data={[]} onViewDetails={() => undefined} />);

    expect(screen.getByText(/nenhuma solicitação encontrada/i)).toBeInTheDocument();
  });

  it('does not render Cartão SUS', () => {
    render(<Table data={[row]} onViewDetails={vi.fn()} />);

    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('ABC1234567')).toBeInTheDocument();
    expect(screen.queryByText(/cartão sus/i)).not.toBeInTheDocument();
  });
});
