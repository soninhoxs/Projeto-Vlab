import { Loader2 } from 'lucide-react';
import { useDelayedTrue } from '../hooks/useDelayedTrue';

interface ListRefreshBannerProps {
  active: boolean;
}

export function ListRefreshBanner({ active }: ListRefreshBannerProps) {
  const show = useDelayedTrue(active, 180);

  if (!show) {
    return null;
  }

  return (
    <div className="list-refresh-banner" role="status" aria-live="polite" aria-busy="true">
      <span className="list-refresh-banner__icon" aria-hidden="true">
        <Loader2 size={20} className="spin" />
      </span>
      <div className="list-refresh-banner__text">
        <strong className="list-refresh-banner__title">Atualizando solicitações</strong>
        <span className="list-refresh-banner__hint">
          Aguarde enquanto buscamos os dados com os filtros selecionados.
        </span>
      </div>
    </div>
  );
}
