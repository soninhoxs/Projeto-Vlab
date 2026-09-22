import React from 'react';
import { BarChart2, FileText } from 'lucide-react';
import { LogoVlab } from './LogoVlab';

export type AppView = 'fila' | 'painel';

interface SidebarProps {
  isOpen: boolean;
  view: AppView;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, view, setIsOpen }) => {
  return (
    <>
      <aside
        id="sidebar"
        className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
        aria-label="Menu de navegação principal"
      >
        <div className="sidebar__brand">
          <LogoVlab className="sidebar__logo" />
        </div>

        <nav className="sidebar__nav" role="navigation" aria-label="Menu operacional">
          <p className="sidebar__section-label" id="menu-label">Menu Operacional</p>
          <ul className="sidebar__nav-list" role="list" aria-labelledby="menu-label">
            <li>
              <a
                href="#fila"
                className={`sidebar__nav-item${view === 'fila' ? ' sidebar__nav-item--active' : ''}`}
                aria-current={view === 'fila' ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
              >
                <FileText size={20} aria-hidden="true" />
                Fila de Solicitações
              </a>
            </li>
            <li>
              <a
                href="#painel"
                className={`sidebar__nav-item${view === 'painel' ? ' sidebar__nav-item--active' : ''}`}
                aria-current={view === 'painel' ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
              >
                <BarChart2 size={20} aria-hidden="true" />
                Painel
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <div
        id="sidebar-overlay"
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      ></div>
    </>
  );
};
