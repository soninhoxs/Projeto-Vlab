import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Solicitacao } from '../types';

interface UseSolicitacaoOptions {
  id: number | null;
  enabled?: boolean;
}

export const useSolicitacao = ({ id, enabled = true }: UseSolicitacaoOptions) => {
  const query = useQuery<Solicitacao>({
    queryKey: ['solicitacao', id],
    queryFn: async () => {
      if (!id) throw new Error('ID não fornecido');
      const response = await api.get<Solicitacao>(`/solicitacoes/${id}`);
      return response.data;
    },
    enabled: enabled && id !== null,
    retry: 1,
  });

  return {
    solicitacao: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
