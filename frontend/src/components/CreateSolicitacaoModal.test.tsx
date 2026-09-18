import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CreateSolicitacaoModal } from './CreateSolicitacaoModal';

const { createSolicitacao, resetCreate } = vi.hoisted(() => ({
  createSolicitacao: vi.fn(),
  resetCreate: vi.fn(),
}));

vi.mock('../hooks/useSolicitacoesMutations', () => ({
  useSolicitacoesMutations: () => ({
    createSolicitacao,
    isCreating: false,
    createError: null,
    getErrorMessage: () => 'Erro ao processar requisição.',
    resetCreate,
  }),
}));

describe('CreateSolicitacaoModal', () => {
  beforeEach(() => {
    createSolicitacao.mockReset();
    resetCreate.mockReset();
  });

  it('does not submit a name shorter than 3 characters', () => {
    render(<CreateSolicitacaoModal isOpen onClose={() => undefined} />);

    fireEvent.change(screen.getByLabelText(/nome do solicitante/i), { target: { value: 'Jo' } });
    fireEvent.submit(screen.getByRole('button', { name: /criar solicitação/i }).closest('form')!);

    expect(screen.getByText(/mínimo 3 caracteres/i)).toBeInTheDocument();
    expect(createSolicitacao).not.toHaveBeenCalled();
  });

  it('does not submit a name with digits', () => {
    render(<CreateSolicitacaoModal isOpen onClose={() => undefined} />);

    fireEvent.change(screen.getByLabelText(/nome do solicitante/i), { target: { value: 'Ana 123' } });
    fireEvent.submit(screen.getByRole('button', { name: /criar solicitação/i }).closest('form')!);

    expect(screen.getByText(/apenas letras/i)).toBeInTheDocument();
    expect(createSolicitacao).not.toHaveBeenCalled();
  });

  it('requires justification for URGENTE', () => {
    render(<CreateSolicitacaoModal isOpen onClose={() => undefined} />);

    fireEvent.change(screen.getByLabelText(/nome do solicitante/i), { target: { value: 'Ana Souza' } });
    fireEvent.change(screen.getByLabelText(/prioridade/i), { target: { value: 'URGENTE' } });
    fireEvent.submit(screen.getByRole('button', { name: /criar solicitação/i }).closest('form')!);

    expect(screen.getByText(/justificativa é obrigatória/i)).toBeInTheDocument();
    expect(createSolicitacao).not.toHaveBeenCalled();
  });

  it('shows the protocol after a successful create', () => {
    createSolicitacao.mockImplementation((_data, options: { onSuccess?: (response: { data: { protocolo: string } }) => void }) => {
      options.onSuccess?.({ data: { protocolo: 'VTXXXSBCUX' } });
    });

    render(<CreateSolicitacaoModal isOpen onClose={() => undefined} />);

    fireEvent.change(screen.getByLabelText(/nome do solicitante/i), { target: { value: 'Ana Souza' } });
    fireEvent.submit(screen.getByRole('button', { name: /criar solicitação/i }).closest('form')!);

    expect(createSolicitacao).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/solicitação criada com sucesso/i)).toBeInTheDocument();
    expect(screen.getByText('VTXXXSBCUX')).toBeInTheDocument();
  });
});
