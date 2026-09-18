import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useSolicitacoesMutations, type CreateSolicitacaoData } from '../hooks/useSolicitacoesMutations';

interface CreateSolicitacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const INITIAL_FORM_STATE: CreateSolicitacaoData = {
  nome_solicitante: '',
  categoria: 'CONSULTA',
  prioridade: 'BAIXA',
  descricao: '',
  justificativa_prioridade: '',
};

interface FormErrors {
  nome_solicitante?: string;
  categoria?: string;
  prioridade?: string;
  justificativa_prioridade?: string;
}

export const CreateSolicitacaoModal: React.FC<CreateSolicitacaoModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState<CreateSolicitacaoData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successProtocol, setSuccessProtocol] = useState<string | null>(null);

  const {
    createSolicitacao,
    isCreating,
    createError,
    getErrorMessage,
    resetCreate,
  } = useSolicitacoesMutations();

  const resetModalState = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setShowSuccess(false);
    setSuccessProtocol(null);
    resetCreate();
  }, [resetCreate]);

  useEffect(() => {
    resetModalState();
  }, [isOpen, resetModalState]);

  useEffect(() => {
    if (!isOpen || !showSuccess) return;

    const timer = setTimeout(() => {
      onClose();
    }, 900);

    return () => clearTimeout(timer);
  }, [isOpen, showSuccess, onClose]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nome_solicitante.trim()) {
      newErrors.nome_solicitante = 'Nome do solicitante é obrigatório';
    } else if (formData.nome_solicitante.length > 255) {
      newErrors.nome_solicitante = 'Nome deve ter no máximo 255 caracteres';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória';
    }

    if (!formData.prioridade) {
      newErrors.prioridade = 'Prioridade é obrigatória';
    }

    if (formData.prioridade === 'URGENTE' && !formData.justificativa_prioridade?.trim()) {
      newErrors.justificativa_prioridade = 'Justificativa é obrigatória para prioridade URGENTE';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const dataToSubmit: CreateSolicitacaoData = {
      nome_solicitante: formData.nome_solicitante.trim(),
      categoria: formData.categoria,
      prioridade: formData.prioridade,
      descricao: formData.descricao?.trim() || undefined,
      justificativa_prioridade: formData.prioridade === 'URGENTE' 
        ? formData.justificativa_prioridade?.trim() 
        : undefined,
    };

    createSolicitacao(dataToSubmit, {
      onSuccess: (response) => {
        onCreated?.();
        setSuccessProtocol(response.data.protocolo);
        setShowSuccess(true);
      },
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isCreating) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isCreating) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal">
        <header className="modal__header">
          <h2 id="modal-title" className="modal__title">Nova Solicitação</h2>
          <button 
            type="button" 
            className="modal__close" 
            onClick={onClose}
            disabled={isCreating}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </header>

        {showSuccess ? (
          <div className="modal__content">
            <div className="modal__success">
              <CheckCircle2 size={48} className="modal__success-icon" />
              <h3>Solicitação criada com sucesso!</h3>
              <p>Protocolo: <strong>{successProtocol ?? '—'}</strong></p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal__content">
            {createError && (
              <div className="form__error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{getErrorMessage(createError)}</span>
              </div>
            )}

            <div className="form__group">
              <label htmlFor="nome_solicitante" className="form__label">
                Nome do Solicitante <span className="form__required">*</span>
              </label>
              <input
                type="text"
                id="nome_solicitante"
                name="nome_solicitante"
                className={`form__input ${errors.nome_solicitante ? 'form__input--error' : ''}`}
                value={formData.nome_solicitante}
                onChange={handleChange}
                placeholder="Digite o nome completo"
                maxLength={120}
                autoComplete="name"
                disabled={isCreating}
                autoFocus
              />
              {errors.nome_solicitante && (
                <span className="form__error">{errors.nome_solicitante}</span>
              )}
            </div>

            <div className="form__row">
              <div className="form__group">
                <label htmlFor="categoria" className="form__label">
                  Categoria <span className="form__required">*</span>
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  className={`form__select ${errors.categoria ? 'form__select--error' : ''}`}
                  value={formData.categoria}
                  onChange={handleChange}
                  disabled={isCreating}
                >
                  <option value="CONSULTA">Consulta</option>
                  <option value="EXAME">Exame</option>
                  <option value="VACINACAO">Vacinação</option>
                  <option value="OUTRO">Outro</option>
                </select>
                {errors.categoria && (
                  <span className="form__error">{errors.categoria}</span>
                )}
              </div>

              <div className="form__group">
                <label htmlFor="prioridade" className="form__label">
                  Prioridade <span className="form__required">*</span>
                </label>
                <select
                  id="prioridade"
                  name="prioridade"
                  className={`form__select ${errors.prioridade ? 'form__select--error' : ''}`}
                  value={formData.prioridade}
                  onChange={handleChange}
                  disabled={isCreating}
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
                {errors.prioridade && (
                  <span className="form__error">{errors.prioridade}</span>
                )}
              </div>
            </div>

            {formData.prioridade === 'URGENTE' && (
              <div className="form__group">
                <label htmlFor="justificativa_prioridade" className="form__label">
                  Justificativa da Prioridade <span className="form__required">*</span>
                </label>
                <textarea
                  id="justificativa_prioridade"
                  name="justificativa_prioridade"
                  className={`form__textarea ${errors.justificativa_prioridade ? 'form__textarea--error' : ''}`}
                  value={formData.justificativa_prioridade}
                  onChange={handleChange}
                  placeholder="Explique o motivo da urgência..."
                  maxLength={1000}
                  rows={3}
                  disabled={isCreating}
                />
                {errors.justificativa_prioridade && (
                  <span className="form__error">{errors.justificativa_prioridade}</span>
                )}
              </div>
            )}

            <div className="form__group">
              <label htmlFor="descricao" className="form__label">
                Descrição
              </label>
              <textarea
                id="descricao"
                name="descricao"
                className="form__textarea"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descreva detalhes da solicitação (opcional)"
                maxLength={2000}
                rows={4}
                disabled={isCreating}
              />
            </div>

            <footer className="modal__footer">
              <button 
                type="button" 
                className="btn btn--secondary" 
                onClick={onClose}
                disabled={isCreating}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn--primary"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Solicitação'
                )}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
};
