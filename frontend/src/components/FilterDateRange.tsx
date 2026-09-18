import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  formatBrDate,
  fromIsoDate,
  getMonthGrid,
  isDateInRange,
  isSameDay,
  parseBrDate,
  toIsoDate,
  validateDraftPeriod,
} from '../utils/date';
import { isEventOnThemeToggle } from '../utils/dom';
import { DateSegmentInput } from './DateSegmentInput';

interface FilterDateRangeProps {
  dataInicio: string;
  dataFim: string;
  onChange: (dataInicio: string, dataFim: string) => void;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function isoToBr(iso: string): string {
  const date = fromIsoDate(iso);
  return date ? formatBrDate(date) : '';
}

function buildTriggerLabel(dataInicio: string, dataFim: string): string {
  if (!dataInicio && !dataFim) return 'Período: Todos';

  const inicioLabel = dataInicio ? isoToBr(dataInicio) : '...';
  const fimLabel = dataFim ? isoToBr(dataFim) : '...';
  return `${inicioLabel} — ${fimLabel}`;
}

export const FilterDateRange: React.FC<FilterDateRangeProps> = ({
  dataInicio,
  dataFim,
  onChange,
}) => {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftInicio, setDraftInicio] = useState('');
  const [draftFim, setDraftFim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(() => fromIsoDate(dataInicio) ?? fromIsoDate(dataFim) ?? new Date());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  const hasPeriod = Boolean(dataInicio || dataFim);
  const triggerLabel = buildTriggerLabel(dataInicio, dataFim);

  const draftStartDate = useMemo(() => parseBrDate(draftInicio), [draftInicio]);
  const draftEndDate = useMemo(() => parseBrDate(draftFim), [draftFim]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setError(null);
    setRangeStart(null);
  }, []);

  const openMenu = useCallback(() => {
    setDraftInicio(isoToBr(dataInicio));
    setDraftFim(isoToBr(dataFim));
    setError(null);
    setRangeStart(null);
    setViewDate(fromIsoDate(dataInicio) ?? fromIsoDate(dataFim) ?? new Date());
    setIsOpen(true);
  }, [dataFim, dataInicio]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (isEventOnThemeToggle(event)) return;
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeMenu, isOpen]);

  const syncDraftFromCalendar = (start: Date | null, end: Date | null) => {
    setDraftInicio(start ? formatBrDate(start) : '');
    setDraftFim(end ? formatBrDate(end) : '');
    setError(null);
  };

  const handleDaySelect = (day: Date) => {
    if (!rangeStart || draftEndDate) {
      setRangeStart(day);
      syncDraftFromCalendar(day, null);
      return;
    }

    if (day < rangeStart) {
      setRangeStart(day);
      syncDraftFromCalendar(day, null);
      return;
    }

    syncDraftFromCalendar(rangeStart, day);
    setRangeStart(null);
  };

  const handleApply = () => {
    const validation = validateDraftPeriod(draftInicio, draftFim);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    const inicioIso = draftInicio ? toIsoDate(parseBrDate(draftInicio)!) : '';
    const fimIso = draftFim ? toIsoDate(parseBrDate(draftFim)!) : '';

    onChange(inicioIso, fimIso);
    closeMenu();
  };

  const handleClear = () => {
    setDraftInicio('');
    setDraftFim('');
    setRangeStart(null);
    setError(null);
    onChange('', '');
    closeMenu();
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setViewDate(today);
    syncDraftFromCalendar(today, today);
    setRangeStart(null);
  };

  const monthCells = getMonthGrid(viewDate.getFullYear(), viewDate.getMonth());

  return (
    <div
      ref={containerRef}
      className={`filter-date-range${isOpen ? ' filter-date-range--open' : ''}${hasPeriod ? ' filter-date-range--active' : ''}`}
    >
      <span id={`${panelId}-label`} className="sr-only">
        Filtrar por período de criação
      </span>

      <button
        type="button"
        id="filter-periodo"
        className="filter-date-range__trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-labelledby={`${panelId}-label`}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
      >
        <span className="filter-date-range__trigger-content">
          <Calendar className="filter-date-range__icon" size={16} aria-hidden="true" />
          <span className="filter-date-range__value">{triggerLabel}</span>
        </span>
        <ChevronDown className="filter-date-range__chevron" size={16} aria-hidden="true" />
      </button>

      <div
        id={panelId}
        className="filter-date-range__menu"
        role="dialog"
        aria-labelledby={`${panelId}-label`}
        aria-hidden={!isOpen}
      >
        <div className="filter-date-range__panel">
          <div className="filter-date-range__fields">
            <DateSegmentInput
              id="filter-data-inicio"
              label="Início"
              value={draftInicio}
              onChange={(nextValue) => {
                setDraftInicio(nextValue);
                setError(null);
                setRangeStart(null);
              }}
            />

            <span className="filter-date-range__separator" aria-hidden="true">
              até
            </span>

            <DateSegmentInput
              id="filter-data-fim"
              label="Fim"
              value={draftFim}
              onChange={(nextValue) => {
                setDraftFim(nextValue);
                setError(null);
                setRangeStart(null);
              }}
            />
          </div>

          {error && (
            <p className="filter-date-range__error" role="alert">
              {error}
            </p>
          )}

          <div className="filter-date-range__calendar">
            <div className="filter-date-range__calendar-header">
              <button
                type="button"
                className="filter-date-range__nav"
                aria-label="Mês anterior"
                onClick={() =>
                  setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>

              <span className="filter-date-range__month">
                {MONTHS[viewDate.getMonth()]} de {viewDate.getFullYear()}
              </span>

              <button
                type="button"
                className="filter-date-range__nav"
                aria-label="Próximo mês"
                onClick={() =>
                  setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="filter-date-range__weekdays" aria-hidden="true">
              {WEEKDAYS.map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>

            <div className="filter-date-range__days">
              {monthCells.map((day, index) => {
                if (!day) {
                  return <span key={`empty-${index}`} className="filter-date-range__day filter-date-range__day--empty" />;
                }

                const isStart = draftStartDate ? isSameDay(day, draftStartDate) : false;
                const isEnd = draftEndDate ? isSameDay(day, draftEndDate) : false;
                const inRange = isDateInRange(day, draftStartDate, draftEndDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={toIsoDate(day)}
                    type="button"
                    className={[
                      'filter-date-range__day',
                      inRange ? 'filter-date-range__day--in-range' : '',
                      isStart ? 'filter-date-range__day--start' : '',
                      isEnd ? 'filter-date-range__day--end' : '',
                      isToday ? 'filter-date-range__day--today' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleDaySelect(day)}
                    aria-label={formatBrDate(day)}
                    aria-pressed={isStart || isEnd}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-date-range__actions">
            <button type="button" className="filter-date-range__action filter-date-range__action--ghost" onClick={handleToday}>
              Hoje
            </button>
            <div className="filter-date-range__actions-group">
              <button type="button" className="filter-date-range__action filter-date-range__action--ghost" onClick={handleClear}>
                Limpar
              </button>
              <button type="button" className="filter-date-range__action filter-date-range__action--primary" onClick={handleApply}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};