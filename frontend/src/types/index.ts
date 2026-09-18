export type Categoria = 'CONSULTA' | 'EXAME' | 'VACINACAO' | 'VACINAÇÃO' | 'OUTRO';
export type Prioridade = 'URGENTE' | 'ALTA' | 'MEDIA' | 'MÉDIA' | 'BAIXA';
export type Status = 'RECEBIDA' | 'EM_ANALISE' | 'EM ANÁLISE' | 'AGENDADA' | 'CONCLUIDA' | 'CONCLUÍDA' | 'CANCELADA';

export interface Solicitacao {
  id?: number;
  protocolo: string;
  nome: string;
  nome_solicitante?: string;
  cartaoSus?: string;
  cartao_sus?: string;
  categoria: Categoria;
  prioridade: Prioridade;
  status: Status;
  dataCriacao?: string;
  horaCriacao?: string;
  created_at?: string;
  updated_at?: string;
  descricao?: string | null;
  justificativa_prioridade?: string | null;
}

export interface Filtros {
  categoria: string;
  prioridade: string;
  status: string;
  busca: string;
  dataInicio: string;
  dataFim: string;
}

export const DEFAULT_FILTROS: Filtros = {
  categoria: 'todas',
  prioridade: 'todas',
  status: 'todos',
  busca: '',
  dataInicio: '',
  dataFim: '',
};

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  pages: number[];
}

