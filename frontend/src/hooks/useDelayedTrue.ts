import { useEffect, useState } from 'react';

/**
 * Evita flash em carregamentos rápidos; mantém o indicador se a operação demorar.
 */
export function useDelayedTrue(active: boolean, delayMs = 200): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [active, delayMs]);

  return visible;
}
