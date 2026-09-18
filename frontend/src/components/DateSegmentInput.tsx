import React, { useRef } from 'react';
import { buildPartialBrDate, parseDateSegments } from '../utils/date';

interface DateSegmentInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const DateSegmentInput: React.FC<DateSegmentInputProps> = ({
  id,
  label,
  value,
  onChange,
}) => {
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const segments = parseDateSegments(value);

  const updateSegments = (next: { day?: string; month?: string; year?: string }) => {
    onChange(
      buildPartialBrDate({
        day: next.day ?? segments.day,
        month: next.month ?? segments.month,
        year: next.year ?? segments.year,
      }),
    );
  };

  const handleDayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const day = event.target.value.replace(/\D/g, '').slice(0, 2);
    updateSegments({ day });
    if (day.length === 2) {
      monthRef.current?.focus();
      monthRef.current?.select();
    }
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const month = event.target.value.replace(/\D/g, '').slice(0, 2);
    updateSegments({ month });
    if (month.length === 2) {
      yearRef.current?.focus();
      yearRef.current?.select();
    }
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const year = event.target.value.replace(/\D/g, '').slice(0, 4);
    updateSegments({ year });
  };

  const handleDayKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && segments.day.length === 0) {
      event.preventDefault();
    }
  };

  const handleMonthKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && segments.month.length === 0) {
      event.preventDefault();
      const dayInput = event.currentTarget.parentElement?.querySelector<HTMLInputElement>('[data-part="day"]');
      dayInput?.focus();
    }
  };

  const handleYearKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && segments.year.length === 0) {
      event.preventDefault();
      monthRef.current?.focus();
    }
  };

  return (
    <label className="filter-date-range__field" htmlFor={`${id}-day`}>
      <span>{label}</span>
      <div className="filter-date-range__segments" role="group" aria-label={`${label} dd/mm/aaaa`}>
        <input
          id={`${id}-day`}
          data-part="day"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd"
          maxLength={2}
          value={segments.day}
          onChange={handleDayChange}
          onKeyDown={handleDayKeyDown}
          aria-label={`${label} dia`}
        />
        <span className="filter-date-range__segments-sep" aria-hidden="true">/</span>
        <input
          ref={monthRef}
          data-part="month"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="mm"
          maxLength={2}
          value={segments.month}
          onChange={handleMonthChange}
          onKeyDown={handleMonthKeyDown}
          aria-label={`${label} mês`}
        />
        <span className="filter-date-range__segments-sep" aria-hidden="true">/</span>
        <input
          ref={yearRef}
          data-part="year"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="aaaa"
          maxLength={4}
          value={segments.year}
          onChange={handleYearChange}
          onKeyDown={handleYearKeyDown}
          aria-label={`${label} ano`}
        />
      </div>
    </label>
  );
};
