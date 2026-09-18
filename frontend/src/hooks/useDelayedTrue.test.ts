import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDelayedTrue } from './useDelayedTrue';

describe('useDelayedTrue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should stay false until delay elapses while active', () => {
    const { result } = renderHook(() => useDelayedTrue(true, 200));

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  it('should reset to false immediately when active becomes false', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedTrue(active, 100),
      { initialProps: { active: true } },
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(true);

    rerender({ active: false });
    expect(result.current).toBe(false);
  });
});
