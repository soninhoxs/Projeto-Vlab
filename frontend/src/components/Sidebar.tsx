import React from 'react';
import { Activity, FileText, Layers, Send, BarChart2 } from 'lucide-react';
import { LogoVlab } from './LogoVlab';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
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
              <a href="#triagem" className="sidebar__nav-item" aria-current="false">
                <Activity size={20} aria-hidden="true" />
                Triagem Geral
              </a>
            </li>
            <li>
              <a href="#fila" className="sidebar__nav-item sidebar__nav-item--active" aria-current="page">
                <FileText size={20} aria-hidden="true" />
                Fila de Solicitações
              </a>
            </li>
            <li>
              <a href="#regulacao" className="sidebar__nav-item" aria-current="false">
                <Layers size={20} aria-hidden="true" />
                Regulação de Leitos
              </a>
            </li>
            <li>
              <a href="#encaminhamentos" className="sidebar__nav-item" aria-current="false">
                <Send size={20} aria-hidden="true" />
                Encaminhamentos
              </a>
            </li>
            <li>
              <a href="#indicadores" className="sidebar__nav-item" aria-current="false">
                <BarChart2 size={20} aria-hidden="true" />
                Indicadores &amp; Relatórios
              </a>
            </li>
          </ul>
        </nav>

        <footer className="sidebar__footer">
          <div className="sidebar__server-status">
            <span className="sidebar__server-dot" aria-hidden="true"></span>
            <span className="sidebar__server-label">Servidor Ativo</span>
            <span className="sidebar__server-version">v2.4-SUS</span>
          </div>
        </footer>
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
