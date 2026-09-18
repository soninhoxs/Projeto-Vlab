import { describe, it, expect } from 'vitest';
import { ALLOWED_TRANSITIONS, STATUS_LABELS } from './useSolicitacoesMutations';

describe('useSolicitacoesMutations - State Machine', () => {
  describe('ALLOWED_TRANSITIONS', () => {
    it('should allow RECEBIDA to transition to EM_ANALISE or CANCELADA', () => {
      expect(ALLOWED_TRANSITIONS.RECEBIDA).toContain('EM_ANALISE');
      expect(ALLOWED_TRANSITIONS.RECEBIDA).toContain('CANCELADA');
      expect(ALLOWED_TRANSITIONS.RECEBIDA).not.toContain('AGENDADA');
      expect(ALLOWED_TRANSITIONS.RECEBIDA).not.toContain('CONCLUIDA');
    });

    it('should allow EM_ANALISE to transition to AGENDADA or CANCELADA', () => {
      expect(ALLOWED_TRANSITIONS.EM_ANALISE).toContain('AGENDADA');
      expect(ALLOWED_TRANSITIONS.EM_ANALISE).toContain('CANCELADA');
      expect(ALLOWED_TRANSITIONS.EM_ANALISE).not.toContain('RECEBIDA');
      expect(ALLOWED_TRANSITIONS.EM_ANALISE).not.toContain('CONCLUIDA');
    });

    it('should allow AGENDADA to transition to CONCLUIDA or CANCELADA', () => {
      expect(ALLOWED_TRANSITIONS.AGENDADA).toContain('CONCLUIDA');
      expect(ALLOWED_TRANSITIONS.AGENDADA).toContain('CANCELADA');
      expect(ALLOWED_TRANSITIONS.AGENDADA).not.toContain('RECEBIDA');
      expect(ALLOWED_TRANSITIONS.AGENDADA).not.toContain('EM_ANALISE');
    });

    it('should not allow transitions from CONCLUIDA (terminal state)', () => {
      expect(ALLOWED_TRANSITIONS.CONCLUIDA).toHaveLength(0);
    });

    it('should not allow transitions from CANCELADA (terminal state)', () => {
      expect(ALLOWED_TRANSITIONS.CANCELADA).toHaveLength(0);
    });
  });

  describe('STATUS_LABELS', () => {
    it('should have labels for all statuses', () => {
      expect(STATUS_LABELS.RECEBIDA).toBe('Recebida');
      expect(STATUS_LABELS.EM_ANALISE).toBe('Em Análise');
      expect(STATUS_LABELS.AGENDADA).toBe('Agendada');
      expect(STATUS_LABELS.CONCLUIDA).toBe('Concluída');
      expect(STATUS_LABELS.CANCELADA).toBe('Cancelada');
    });
  });

  describe('canTransitionTo logic', () => {
    // Helper to simulate the canTransitionTo function
    const canTransitionTo = (currentStatus: string, newStatus: string): boolean => {
      const normalizedCurrent = currentStatus.replace(' ', '_').replace('Á', 'A').replace('Í', 'I').toUpperCase();
      const allowed = ALLOWED_TRANSITIONS[normalizedCurrent] || [];
      return allowed.includes(newStatus);
    };

    it('should validate transition from RECEBIDA to EM_ANALISE', () => {
      expect(canTransitionTo('RECEBIDA', 'EM_ANALISE')).toBe(true);
    });

    it('should validate transition from RECEBIDA to CANCELADA', () => {
      expect(canTransitionTo('RECEBIDA', 'CANCELADA')).toBe(true);
    });

    it('should reject invalid transition from RECEBIDA to AGENDADA', () => {
      expect(canTransitionTo('RECEBIDA', 'AGENDADA')).toBe(false);
    });

    it('should handle status with spaces (EM ANÁLISE)', () => {
      expect(canTransitionTo('EM ANÁLISE', 'AGENDADA')).toBe(true);
      expect(canTransitionTo('EM ANÁLISE', 'CANCELADA')).toBe(true);
    });

    it('should reject any transition from terminal states', () => {
      expect(canTransitionTo('CONCLUIDA', 'CANCELADA')).toBe(false);
      expect(canTransitionTo('CANCELADA', 'RECEBIDA')).toBe(false);
    });
  });

  describe('getAllowedTransitions logic', () => {
    // Helper to simulate the getAllowedTransitions function
    const getAllowedTransitions = (currentStatus: string): string[] => {
      const normalizedCurrent = currentStatus.replace(' ', '_').replace('Á', 'A').replace('Í', 'I').toUpperCase();
      return ALLOWED_TRANSITIONS[normalizedCurrent] || [];
    };

    it('should return correct transitions for RECEBIDA', () => {
      const transitions = getAllowedTransitions('RECEBIDA');
      expect(transitions).toEqual(['EM_ANALISE', 'CANCELADA']);
    });

    it('should return correct transitions for EM_ANALISE', () => {
      const transitions = getAllowedTransitions('EM_ANALISE');
      expect(transitions).toEqual(['AGENDADA', 'CANCELADA']);
    });

    it('should return empty array for terminal states', () => {
      expect(getAllowedTransitions('CONCLUIDA')).toEqual([]);
      expect(getAllowedTransitions('CANCELADA')).toEqual([]);
    });

    it('should handle unknown status gracefully', () => {
      expect(getAllowedTransitions('UNKNOWN')).toEqual([]);
    });
  });
});
