import React from 'react';
import { Eye } from 'lucide-react';
import type { Solicitacao } from '../types';

interface TableProps {
  data: Solicitacao[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onViewDetails: (solicitacao: Solicitacao) => void;
}

const CATEGORY_CLASS_MAP: Record<string, string> = {
  'CONSULTA': 'badge--consulta',
  'EXAME': 'badge--exame',
  'VACINAÇÃO': 'badge--vacinacao',
  'VACINACAO': 'badge--vacinacao',
  'OUTRO': 'badge--outro',
};

const PRIORITY_CLASS_MAP: Record<string, string> = {
  'URGENTE': 'badge--urgente',
  'ALTA': 'badge--alta',
  'MÉDIA': 'badge--media',
  'MEDIA': 'badge--media',
  'BAIXA': 'badge--baixa',
};

const STATUS_CLASS_MAP: Record<string, string> = {
  'RECEBIDA': 'badge--recebida',
  'EM_ANALISE': 'badge--em-analise',
  'EM ANÁLISE': 'badge--em-analise',
  'AGENDADA': 'badge--agendada',
  'CONCLUIDA': 'badge--concluida',
  'CONCLUÍDA': 'badge--concluida',
  'CANCELADA': 'badge--cancelada',
};

const formatStatus = (s: string) => {
  if (s === 'EM_ANALISE' || s === 'EM ANÁLISE') return 'Em Análise';
  if (s === 'CONCLUIDA' || s === 'CONCLUÍDA') return 'Concluída';
  if (s === 'RECEBIDA') return 'Recebida';
  if (s === 'AGENDADA') return 'Agendada';
  if (s === 'CANCELADA') return 'Cancelada';
  return s;
};

const formatPriority = (p: string) => {
  if (p === 'URGENTE') return 'Urgente';
  if (p === 'ALTA') return 'Alta';
  if (p === 'MEDIA' || p === 'MÉDIA') return 'Média';
  if (p === 'BAIXA') return 'Baixa';
  return p;
};

const formatCategory = (c: string) => {
  if (c === 'CONSULTA') return 'Consulta';
  if (c === 'EXAME') return 'Exame';
  if (c === 'VACINACAO' || c === 'VACINAÇÃO') return 'Vacinação';
  if (c === 'OUTRO') return 'Outro';
  return c;
};

export const Table: React.FC<TableProps> = ({ data, isLoading, isRefreshing, onViewDetails }) => {
  const showInitialLoading = Boolean(isLoading && data.length === 0);

  return (
    <section
      className={`table-container${isRefreshing ? ' table-container--refreshing' : ''}`}
      aria-label="Lista de solicitações de atendimento"
      aria-busy={showInitialLoading || isRefreshing}
    >
      <div className="table-wrapper">
        <table className="table" role="table">
          <caption className="sr-only">
            Tabela de solicitações de atendimento clínico reguladas pelo SUS
          </caption>
          <thead>
            <tr>
              <th scope="col">Protocolo</th>
              <th scope="col">Solicitante</th>
              <th scope="col">Categoria</th>
              <th scope="col">Prioridade</th>
              <th scope="col">Status</th>
              <th scope="col">Data de Criação</th>
              <th scope="col">Ações Regulatórias</th>
            </tr>
          </thead>
          <tbody>
            {showInitialLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <div className="empty-state">
                    <p style={{ color: 'var(--color-neutral-500)' }}>Carregando solicitações...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <div className="empty-state">
                    <p style={{ color: 'var(--color-neutral-500)' }}>Nenhuma solicitação encontrada para os filtros atuais.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.protocolo}>
                  <td data-label="Protocolo">
                    <span className="table__protocol">{item.protocolo}</span>
                  </td>
                  <td data-label="Solicitante">
                    <div className="table__solicitante">
                      <span className="table__solicitante-name">{item.nome}</span>
                    </div>
                  </td>
                  <td data-label="Categoria">
                    <span className={`badge ${CATEGORY_CLASS_MAP[item.categoria] || ''}`}>
                      {formatCategory(item.categoria)}
                    </span>
                  </td>
                  <td data-label="Prioridade">
                    <span className={`badge ${PRIORITY_CLASS_MAP[item.prioridade] || ''}`}>
                      <span className="badge__dot" aria-hidden="true"></span>
                      {formatPriority(item.prioridade)}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${STATUS_CLASS_MAP[item.status] || ''}`}>
                      <span className="badge__dot" aria-hidden="true"></span>
                      {formatStatus(item.status)}
                    </span>
                  </td>
                  <td data-label="Data de Criação">
                    <span className="table__date">
                      <time dateTime={item.created_at || undefined}>
                        {item.dataCriacao || '—'}
                        {item.horaCriacao ? (
                          <>
                            <br />
                            {item.horaCriacao}
                          </>
                        ) : null}
                      </time>
                    </span>
                  </td>
                  <td data-label="Ações">
                    <button
                      type="button"
                      className="table__action-btn"
                      aria-label={`Ver detalhes e status de ${item.protocolo}`}
                      onClick={() => onViewDetails(item)}
                    >
                      <Eye size={16} aria-hidden="true" />
                      Detalhes / Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
