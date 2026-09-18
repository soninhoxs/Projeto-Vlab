/**
 * Mascaramento de identificadores sensíveis, no mesmo padrão
 * do dashboard aprovado da V-Lab (CPF mascarado na listagem).
 */
export function maskIdentifier(value?: string | null): string {
  if (!value) return '—';

  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '—';

  const visible = digits.slice(-4);
  return `•••• ${visible}`;
}
