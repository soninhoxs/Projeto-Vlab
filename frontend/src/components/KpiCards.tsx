import React from 'react';
import { Monitor, CheckSquare, Clock, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';

interface KpiCardsProps {
  total: number;
  recebidas: number;
  emAnalise: number;
  agendadas: number;
  urgentes: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ total, recebidas, emAnalise, agendadas, urgentes }) => {
  return (
    <section className="kpi-grid" aria-label="Resumo de solicitações">
      <article className="kpi-card kpi-card--total">
        <div className="kpi-card__header">
          <span className="kpi-card__label">Total de Solicitações</span>
          <Monitor className="kpi-card__icon" size={20} aria-hidden="true" />
        </div>
        <span className="kpi-card__value" aria-live="polite">{total}</span>
        <span className="kpi-card__trend">
          <TrendingUp size={16} aria-hidden="true" />
          +8 hoje vs ontem
        </span>
      </article>

      <article className="kpi-card kpi-card--recebidas">
        <div className="kpi-card__header">
          <span className="kpi-card__label">Recebidas</span>
          <CheckSquare className="kpi-card__icon" size={20} aria-hidden="true" />
        </div>
        <span className="kpi-card__value" aria-live="polite">{recebidas}</span>
        <span className="kpi-card__trend">Novas requisições</span>
      </article>

      <article className="kpi-card kpi-card--analise">
        <div className="kpi-card__header">
          <span className="kpi-card__label">Em Análise</span>
          <Clock className="kpi-card__icon" size={20} aria-hidden="true" />
        </div>
        <span className="kpi-card__value" aria-live="polite">{emAnalise}</span>
        <span className="kpi-card__trend">Aguardando regulação</span>
      </article>

      <article className="kpi-card kpi-card--agendadas">
        <div className="kpi-card__header">
          <span className="kpi-card__label">Agendadas</span>
          <Calendar className="kpi-card__icon" size={20} aria-hidden="true" />
        </div>
        <span className="kpi-card__value" aria-live="polite">{agendadas}</span>
        <span className="kpi-card__trend">Data marcada</span>
      </article>

      <article className="kpi-card kpi-card--urgentes">
        <div className="kpi-card__header">
          <span className="kpi-card__label">Críticas / Urgentes</span>
          <AlertTriangle className="kpi-card__icon" size={20} aria-hidden="true" />
        </div>
        <span className="kpi-card__value" aria-live="polite">{urgentes}</span>
        <span className="kpi-card__trend">Atenção imediata requerida</span>
      </article>
    </section>
  );
};
