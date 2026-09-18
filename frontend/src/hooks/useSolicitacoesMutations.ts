import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api, resolveApiErrorMessage } from '../api/client';
import { abortActiveListFetch, writeCreatedSolicitacaoToCache } from '../api/solicitacoes';
import type { Solicitacao } from '../types';

// Tipos para criação de solicitação
export interface CreateSolicitacaoData {
  nome_solicitante: string;
  categoria: 'CONSULTA' | 'EXAME' | 'VACINACAO' | 'OUTRO';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  descricao?: string;
  justificativa_prioridade?: string;
}

// Tipo para atualização de status
export interface UpdateStatusData {
  id: number;
  status: 'RECEBIDA' | 'EM_ANALISE' | 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA';
}

// Resposta da API para criação
interface CreateResponse {
  message: string;
  data: Solicitacao;
}

// Resposta de erro da API
interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// Mapa de transições permitidas (espelha o backend)
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  RECEBIDA: ['EM_ANALISE', 'CANCELADA'],
  EM_ANALISE: ['AGENDADA', 'CANCELADA'],
  AGENDADA: ['CONCLUIDA', 'CANCELADA'],
  CONCLUIDA: [],
  CANCELADA: [],
};

// Labels amigáveis para os status
export const STATUS_LABELS: Record<string, string> = {
  RECEBIDA: 'Recebida',
  EM_ANALISE: 'Em Análise',
  AGENDADA: 'Agendada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const useSolicitacoesMutations = () => {
  const queryClient = useQueryClient();

  // Mutation para criar solicitação
  const createMutation = useMutation<CreateResponse, AxiosError<ApiErrorResponse>, CreateSolicitacaoData>({
    mutationFn: async (data) => {
      abortActiveListFetch();
      await queryClient.cancelQueries({
        queryKey: ['solicitacoes'],
        fetchStatus: 'fetching',
      });

      const response = await api.post<CreateResponse>('/solicitacoes', data);
      return response.data;
    },
    onSuccess: (response) => {
      writeCreatedSolicitacaoToCache(
        queryClient,
        response.data as unknown as Record<string, unknown>,
      );
    },
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation<CreateResponse, AxiosError<ApiErrorResponse>, UpdateStatusData>({
    mutationFn: async ({ id, status }) => {
      abortActiveListFetch();
      const response = await api.patch<CreateResponse>(`/solicitacoes/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['solicitacoes'], refetchType: 'active' });
      void queryClient.invalidateQueries({ queryKey: ['solicitacao'], refetchType: 'active' });
    },
  });

  // Helper para extrair mensagem de erro da API
  const getErrorMessage = (error: AxiosError<ApiErrorResponse> | Error | null): string => {
    if (!error) {
      return 'Erro ao processar requisição. Tente novamente.';
    }

    return resolveApiErrorMessage(error);
  };

  // Helper para verificar se uma transição é permitida
  const canTransitionTo = (currentStatus: string, newStatus: string): boolean => {
    const normalizedCurrent = currentStatus.replace(' ', '_').replace('Á', 'A').replace('Í', 'I').toUpperCase();
    const allowed = ALLOWED_TRANSITIONS[normalizedCurrent] || [];
    return allowed.includes(newStatus);
  };

  // Helper para obter transições permitidas a partir de um status
  const getAllowedTransitions = (currentStatus: string): string[] => {
    const normalizedCurrent = currentStatus.replace(' ', '_').replace('Á', 'A').replace('Í', 'I').toUpperCase();
    return ALLOWED_TRANSITIONS[normalizedCurrent] || [];
  };

  return {
    // Mutations
    createSolicitacao: createMutation.mutate,
    createSolicitacaoAsync: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutate,
    updateStatusAsync: updateStatusMutation.mutateAsync,
    
    // Estados de loading
    isCreating: createMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    
    // Estados de erro
    createError: createMutation.error,
    updateStatusError: updateStatusMutation.error,
    
    // Estados de sucesso
    isCreateSuccess: createMutation.isSuccess,
    isUpdateStatusSuccess: updateStatusMutation.isSuccess,
    
    // Dados de sucesso
    createdSolicitacao: createMutation.data?.data,
    
    // Reset functions
    resetCreate: createMutation.reset,
    resetUpdateStatus: updateStatusMutation.reset,
    
    // Helpers
    getErrorMessage,
    canTransitionTo,
    getAllowedTransitions,
  };
};
