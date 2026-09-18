import { describe, expect, it } from 'vitest';
import { maskIdentifier } from '../utils/mask';
import { sanitizeSearch } from '../api/client';

describe('maskIdentifier', () => {
  it('mascara identificadores e mantém os 4 últimos dígitos', () => {
    expect(maskIdentifier('898 0012 9941 0023')).toBe('•••• 0023');
  });

  it('não inventa identificador quando o valor está ausente', () => {
    expect(maskIdentifier(undefined)).toBe('—');
    expect(maskIdentifier('')).toBe('—');
  });
});

describe('sanitizeSearch', () => {
  it('remove caracteres de controle e limita o tamanho', () => {
    expect(sanitizeSearch(`abc\u0000${'x'.repeat(200)}`)).toHaveLength(100);
  });
});
