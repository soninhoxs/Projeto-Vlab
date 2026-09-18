import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, FileText, User, Calendar, Clock, Tag, AlertTriangle } from 'lucide-react';
import { useSolicitacao } from '../hooks/useSolicitacao';
import { useSolicitacoesMutations, STATUS_LABELS, ALLOWED_TRANSITIONS } from '../hooks/useSolicitacoesMutations';

interface SolicitacaoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitacaoId: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  CONSULTA: 'Consulta',
  EXAME: 'Exame',
  VACINACAO: 'Vacinação',
  OUTRO: 'Outro',
};

const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

const normalizeStatus = (status: string): string => {
  return status.replace(' ', '_').replace('Á', 'A').replace('Í', 'I').toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export const SolicitacaoDetailModal: React.FC<SolicitacaoDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  solicitacaoId 
}) => {
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  
  const { solicitacao, isLoading: isLoadingDetail, isError, refetch } = useSolicitacao({ 
    id: solicitacaoId, 
    enabled: isOpen && solicitacaoId !== null 
  });

  const {
    updateStatus,
    isUpdatingStatus,
    updateStatusError,
    isUpdateStatusSuccess,
    getErrorMessage,
    resetUpdateStatus,
  } = useSolicitacoesMutations();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatusUpdateSuccess(false);
      resetUpdateStatus();
    }
  }, [isOpen, resetUpdateStatus]);

  // Handle status update success
  useEffect(() => {
    if (isUpdateStatusSuccess) {
      setStatusUpdateSuccess(true);
      refetch();
      // Hide success message after 2 seconds
      const timer = setTimeout(() => {
        setStatusUpdateSuccess(false);
        resetUpdateStatus();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isUpdateStatusSuccess, refetch, resetUpdateStatus]);

  const handleStatusChange = (newStatus: string) => {
    if (!solicitacao?.id) return;
    updateStatus({ 
      id: solicitacao.id, 
      status: newStatus as 'RECEBIDA' | 'EM_ANALISE' | 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA'
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isUpdatingStatus) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isUpdatingStatus) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const normalizedStatus = solicitacao ? normalizeStatus(solicitacao.status) : '';
  const allowedTransitions = ALLOWED_TRANSITIONS[normalizedStatus] || [];
  const isTerminalStatus = allowedTransitions.length === 0;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="modal modal--detail">
        <header className="modal__header">
          <h2 id="detail-modal-title" className="modal__title">
            {solicitacao ? `Solicitação ${solicitacao.protocolo}` : 'Detalhes da Solicitação'}
          </h2>
          <button 
            type="button" 
            className="modal__close" 
            onClick={onClose}
            disabled={isUpdatingStatus}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </header>

        <div className="modal__content">
          {isLoadingDetail ? (
            <div className="modal__loading">
              <Loader2 size={32} className="spin" />
              <p>Carregando detalhes...</p>
            </div>
          ) : isError ? (
            <div className="modal__error">
              <AlertCircle size={32} />
              <p>Erro ao carregar os detalhes da solicitação.</p>
              <button className="btn btn--secondary" onClick={() => refetch()}>
                Tentar novamente
              </button>
            </div>
          ) : solicitacao ? (
            <>
              {/* Status Update Feedback */}
              {statusUpdateSuccess && (
                <div className="form__success-banner" role="alert">
                  <CheckCircle2 size={16} />
                  <span>Status atualizado com sucesso!</span>
                </div>
              )}
              
              {updateStatusError && (
                <div className="form__error-banner" role="alert">
                  <AlertCircle size={16} />
                  <span>{getErrorMessage(updateStatusError)}</span>
                </div>
              )}

              {/* Detail Grid */}
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-item__icon">
                    <FileText size={18} />
                  </div>
                  <div className="detail-item__content">
                    <span className="detail-item__label">Protocolo</span>
                    <span className="detail-item__value">{solicitacao.protocolo}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-item__icon">
                    <User size={18} />
                  </div>
                  <div className="detail-item__content">
                    <span className="detail-item__label">Solicitante</span>
                    <span className="detail-item__value">
                      {solicitacao.nome_solicitante || solicitacao.nome || '—'}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-item__icon">
                    <Tag size={18} />
                  </div>
                  <div className="detail-item__content">
                    <span className="detail-item__label">Categoria</span>
                    <span className="detail-item__value">
                      {CATEGORY_LABELS[solicitacao.categoria] || solicitacao.categoria}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-item__icon">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="detail-item__content">
                    <span className="detail-item__label">Prioridade</span>
                    <span className={`detail-item__value detail-item__value--${solicitacao.prioridade.toLowerCase()}`}>
                      {PRIORITY_LABELS[solicitacao.prioridade] || solicitacao.prioridade}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-item__icon">
                    <Calendar size={18} />
                  </div>
                  <div className="detail-item__content">
                    <span className="detail-item__label">Data de Criação</span>
                    <span className="detail-item__value">{formatDate(solicitacao.created_at)}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-item__icon">
                    <Clock size={18} />
                  </div>
                  <div className="detail-item__content">
                    <span className="detail-item__label">Última Atualização</span>
                    <span className="detail-item__value">{formatDate(solicitacao.updated_at)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {solicitacao.descricao && (
                <div className="detail-section">
                  <h3 className="detail-section__title">Descrição</h3>
                  <p className="detail-section__text">{solicitacao.descricao}</p>
                </div>
              )}

              {/* Priority Justification */}
              {solicitacao.justificativa_prioridade && (
                <div className="detail-section detail-section--warning">
                  <h3 className="detail-section__title">Justificativa de Prioridade</h3>
                  <p className="detail-section__text">{solicitacao.justificativa_prioridade}</p>
                </div>
              )}

              {solicitacao.historico_status && solicitacao.historico_status.length > 0 && (
                <div className="detail-section" aria-label="Histórico de status">
                  <h3 className="detail-section__title">Histórico</h3>
                  <ol className="status-history">
                    {solicitacao.historico_status.map((event, index) => {
                      const toLabel = STATUS_LABELS[event.to_status] || event.to_status;
                      const fromLabel = event.from_status
                        ? STATUS_LABELS[event.from_status] || event.from_status
                        : null;

                      return (
                        <li key={`${event.to_status}-${event.created_at}-${index}`} className="status-history__item">
                          <span className="status-history__transition">
                            {fromLabel ? `${fromLabel} → ${toLabel}` : toLabel}
                          </span>
                          <time className="status-history__date" dateTime={event.created_at}>
                            {formatDate(event.created_at)}
                          </time>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {/* Status Section */}
              <div className="status-section">
                <h3 className="status-section__title">Status Atual</h3>
                <div className="status-section__current">
                  <span className={`badge badge--${normalizedStatus.toLowerCase().replace('_', '-')}`}>
                    <span className="badge__dot" aria-hidden="true"></span>
                    {STATUS_LABELS[normalizedStatus] || solicitacao.status}
                  </span>
                </div>

                {!isTerminalStatus && (
                  <div className="status-section__actions">
                    <h4 className="status-section__subtitle">Alterar Status</h4>
                    <div className="status-buttons">
                      {allowedTransitions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`btn ${status === 'CANCELADA' ? 'btn--danger' : 'btn--secondary'}`}
                          onClick={() => handleStatusChange(status)}
                          disabled={isUpdatingStatus}
                        >
                          {isUpdatingStatus ? (
                            <Loader2 size={16} className="spin" />
                          ) : null}
                          {STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isTerminalStatus && (
                  <p className="status-section__terminal">
                    Este é um status final. Não é possível alterar.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>

        <footer className="modal__footer">
          <button 
            type="button" 
            className="btn btn--secondary" 
            onClick={onClose}
            disabled={isUpdatingStatus}
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};
