const BR_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function maskDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export interface DateSegments {
  day: string;
  month: string;
  year: string;
}

export function parseDateSegments(value: string): DateSegments {
  const [day = '', month = '', year = ''] = value.split('/');
  return {
    day: day.replace(/\D/g, '').slice(0, 2),
    month: month.replace(/\D/g, '').slice(0, 2),
    year: year.replace(/\D/g, '').slice(0, 4),
  };
}

export function buildPartialBrDate({ day, month, year }: DateSegments): string {
  if (!day && !month && !year) return '';

  let result = day;
  if (month.length > 0 || day.length === 2) {
    result += `/${month}`;
  }
  if (year.length > 0 || month.length === 2) {
    result += `/${year}`;
  }

  return result;
}

export function parseBrDate(value: string): Date | null {
  const match = value.match(BR_DATE_PATTERN);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatBrDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(iso: string): Date | null {
  const match = iso.match(ISO_DATE_PATTERN);
  if (!match) return null;

  return parseBrDate(`${match[3]}/${match[2]}/${match[1]}`);
}

export function isCompleteBrDate(value: string): boolean {
  return BR_DATE_PATTERN.test(value);
}

export interface PeriodValidation {
  valid: boolean;
  message: string | null;
}

export function validatePeriod(dataInicio: string, dataFim: string): PeriodValidation {
  if (!dataInicio && !dataFim) {
    return { valid: true, message: null };
  }

  if (dataInicio && !fromIsoDate(dataInicio)) {
    return { valid: false, message: 'Data inicial inválida.' };
  }

  if (dataFim && !fromIsoDate(dataFim)) {
    return { valid: false, message: 'Data final inválida.' };
  }

  if (dataInicio && dataFim && dataInicio > dataFim) {
    return { valid: false, message: 'A data final deve ser igual ou posterior à inicial.' };
  }

  return { valid: true, message: null };
}

export function validateDraftPeriod(inicioBr: string, fimBr: string): PeriodValidation {
  const hasInicio = inicioBr.length > 0;
  const hasFim = fimBr.length > 0;

  if (!hasInicio && !hasFim) {
    return { valid: true, message: null };
  }

  if (hasInicio) {
    if (!isCompleteBrDate(inicioBr)) {
      return { valid: false, message: 'Informe a data inicial completa (dd/mm/aaaa).' };
    }
    if (!parseBrDate(inicioBr)) {
      return { valid: false, message: 'Data inicial inválida.' };
    }
  }

  if (hasFim) {
    if (!isCompleteBrDate(fimBr)) {
      return { valid: false, message: 'Informe a data final completa (dd/mm/aaaa).' };
    }
    if (!parseBrDate(fimBr)) {
      return { valid: false, message: 'Data final inválida.' };
    }
  }

  if (hasInicio && hasFim) {
    const inicio = parseBrDate(inicioBr)!;
    const fim = parseBrDate(fimBr)!;
    if (toIsoDate(inicio) > toIsoDate(fim)) {
      return { valid: false, message: 'A data final deve ser igual ou posterior à inicial.' };
    }
  }

  return { valid: true, message: null };
}

export function getMonthGrid(year: number, month: number): Array<Date | null> {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  );
}

export function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const value = toIsoDate(date);
  return value >= toIsoDate(start) && value <= toIsoDate(end);
}
