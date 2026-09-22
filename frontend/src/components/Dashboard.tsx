import { useEffect, useRef, type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_FILTROS } from '../types';
import {
  fetchSolicitacoes,
  getSolicitacoesQueryKey,
  type DiaTotal,
  type SolicitacoesSummary,
} from '../api/solicitacoes';
import { QUERY_STALE_TIME_MS } from '../api/queryClient';

interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

const STATUS_SLICES: Array<Omit<Slice, 'value'>> = [
  { key: 'RECEBIDA', label: 'Recebida', color: 'var(--color-recebida)' },
  { key: 'EM_ANALISE', label: 'Em análise', color: 'var(--color-analise)' },
  { key: 'AGENDADA', label: 'Agendada', color: 'var(--color-agendada)' },
  { key: 'CONCLUIDA', label: 'Concluída', color: 'var(--color-concluida)' },
  { key: 'CANCELADA', label: 'Cancelada', color: 'var(--color-neutral-500)' },
];

const PRIORIDADE_SLICES: Array<Omit<Slice, 'value'>> = [
  { key: 'URGENTE', label: 'Urgente', color: 'var(--color-urgente)' },
  { key: 'ALTA', label: 'Alta', color: 'var(--color-alta)' },
  { key: 'MEDIA', label: 'Média', color: 'var(--color-media)' },
  { key: 'BAIXA', label: 'Baixa', color: 'var(--color-baixa)' },
];

const CATEGORIA_SLICES: Array<Omit<Slice, 'value'>> = [
  { key: 'CONSULTA', label: 'Consulta', color: 'var(--color-consulta)' },
  { key: 'EXAME', label: 'Exame', color: 'var(--color-exame)' },
  { key: 'VACINACAO', label: 'Vacinação', color: 'var(--color-vacinacao)' },
  { key: 'OUTRO', label: 'Outro', color: 'var(--color-outro)' },
];

function withValues(template: Array<Omit<Slice, 'value'>>, counts: Record<string, number> | undefined): Slice[] {
  return template.map((item) => ({
    ...item,
    value: counts?.[item.key] ?? 0,
  }));
}

function formatDay(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

function BarChart({ title, slices, total }: { title: string; slices: Slice[]; total: number }) {
  const summary = slices.map((slice) => `${slice.label} ${slice.value}`).join(', ');

  return (
    <figure className="dash-card" aria-label={`${title}. ${summary}.`}>
      <figcaption className="dash-card__title">{title}</figcaption>
      <ul className="dash-bars">
        {slices.map((slice) => {
          const width = total > 0 ? Math.round((slice.value / total) * 100) : 0;

          return (
            <li key={slice.key} className="dash-bars__row">
              <span className="dash-bars__label">{slice.label}</span>
              <span className="dash-bars__track" aria-hidden="true">
                <span
                  className="dash-bars__fill"
                  style={{ width: `${width}%`, backgroundColor: slice.color }}
                />
              </span>
              <span className="dash-bars__value">{slice.value}</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

function DayChart({ days }: { days: DiaTotal[] }) {
  const max = Math.max(1, ...days.map((day) => day.total));
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const summary = days
    .filter((day) => day.total > 0)
    .map((day) => `${formatDay(day.data)} ${day.total}`)
    .join(', ');

  return (
    <figure className="dash-card dash-card--wide" aria-label={`Entradas nos últimos 14 dias. ${total} no período.${summary ? ` ${summary}.` : ''}`}>
      <figcaption className="dash-card__title">Entradas nos últimos 14 dias</figcaption>
      <div className="dash-columns">
        {days.map((day) => {
          const height = Math.round((day.total / max) * 100);

          return (
            <div key={day.data} className="dash-columns__item">
              <span className="dash-columns__count">{day.total > 0 ? day.total : ''}</span>
              <span className="dash-columns__track" aria-hidden="true">
                <span
                  className="dash-columns__bar"
                  style={{ height: day.total > 0 ? `${Math.max(height, 8)}%` : '0%' }}
                />
              </span>
              <span className="dash-columns__label">{formatDay(day.data)}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export const Dashboard: FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: getSolicitacoesQueryKey(DEFAULT_FILTROS, 1),
    queryFn: ({ signal }) => fetchSolicitacoes(DEFAULT_FILTROS, 1, signal),
    staleTime: QUERY_STALE_TIME_MS,
  });

  const summary: SolicitacoesSummary | undefined = data?.summary;
  const askedForBreakdown = useRef(false);

  useEffect(() => {
    if (!summary || summary.por_status || askedForBreakdown.current) return;
    askedForBreakdown.current = true;
    void refetch();
  }, [summary, refetch]);

  if (isLoading && !summary) {
    return <p className="dash-state">Carregando o painel…</p>;
  }

  if (isError && !summary) {
    return (
      <div className="main__alert main__alert--error" role="alert">
        Não foi possível carregar os dados do painel.
      </div>
    );
  }

  if (!summary) {
    return <p className="dash-state">Sem dados da fila para montar o painel.</p>;
  }

  const today = summary.por_dia?.[summary.por_dia.length - 1]?.total ?? 0;

  return (
    <div className="dash">
      <p className="dash__lead">
        {summary.por_dia
          ? `${summary.total} solicitações na fila, ${today} com entrada hoje.`
          : `${summary.total} solicitações na fila.`}
      </p>

      {summary.por_dia && <DayChart days={summary.por_dia} />}

      <div className="dash-grid">
        <BarChart title="Por status" slices={withValues(STATUS_SLICES, summary.por_status)} total={summary.total} />
        <BarChart title="Por prioridade" slices={withValues(PRIORIDADE_SLICES, summary.por_prioridade)} total={summary.total} />
        <BarChart title="Por categoria" slices={withValues(CATEGORIA_SLICES, summary.por_categoria)} total={summary.total} />
      </div>
    </div>
  );
};
