import { describe, expect, it } from 'vitest';
import {
  buildPartialBrDate,
  formatBrDate,
  fromIsoDate,
  maskDateInput,
  parseBrDate,
  parseDateSegments,
  toIsoDate,
  validateDraftPeriod,
  validatePeriod,
} from './date';

describe('date utils', () => {
  it('masks partial date input', () => {
    expect(maskDateInput('17092026')).toBe('17/09/2026');
    expect(maskDateInput('17/09/999999')).toBe('17/09/9999');
  });

  it('rejects impossible calendar dates', () => {
    expect(parseBrDate('99/99/9999')).toBeNull();
    expect(parseBrDate('31/02/2026')).toBeNull();
  });

  it('accepts valid calendar dates', () => {
    const date = parseBrDate('17/09/2026');
    expect(date).not.toBeNull();
    expect(formatBrDate(date!)).toBe('17/09/2026');
    expect(toIsoDate(date!)).toBe('2026-09-17');
    expect(fromIsoDate('2026-09-17')).not.toBeNull();
  });

  it('validates draft period messages', () => {
    expect(validateDraftPeriod('99/99/9999', '').message).toBe('Data inicial inválida.');
    expect(validateDraftPeriod('17/09/2026', '10/09/2026').message).toContain('posterior');
  });

  it('builds partial br dates from segments', () => {
    expect(buildPartialBrDate({ day: '17', month: '09', year: '2026' })).toBe('17/09/2026');
    expect(buildPartialBrDate({ day: '17', month: '', year: '' })).toBe('17/');
    expect(parseDateSegments('17/09/2026')).toEqual({ day: '17', month: '09', year: '2026' });
  });

  it('validates iso period', () => {
    expect(validatePeriod('2026-09-20', '2026-09-10').valid).toBe(false);
    expect(validatePeriod('', '').valid).toBe(true);
  });
});
