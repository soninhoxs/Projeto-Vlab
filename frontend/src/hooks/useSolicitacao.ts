import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { QUERY_REVALIDATE_INTERVAL_MS, isBlockingQueryFailure } from '../api/queryClient';
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
    refetchInterval: enabled && id !== null ? QUERY_REVALIDATE_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    retry: 2,
  });

  return {
    solicitacao: query.data,
    isLoading: query.isLoading,
    isError: isBlockingQueryFailure(query.isError, Boolean(query.data)),
    error: query.error,
    refetch: query.refetch,
  };
};
