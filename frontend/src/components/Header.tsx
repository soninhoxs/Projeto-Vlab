import React from 'react';
import { Menu, X, Bell, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LogoVlab } from './LogoVlab';

interface HeaderProps {
  isMenuOpen: boolean;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMenuOpen, onMenuClick }) => {
  return (
    <header className="header" role="banner">
      <button 
        id="sidebar-toggle" 
        className="sidebar__toggle" 
        type="button" 
        aria-label={isMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        aria-expanded={isMenuOpen}
        aria-controls="sidebar"
        onClick={onMenuClick}
      >
        {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      <LogoVlab className="header__logo" />

      <div className="header__title-group">
        <span className="header__title">Solicitações</span>
      </div>

      <div className="header__actions">
        <div className="header__status-badge">
          <User size={16} aria-hidden="true" />
          <span>Operador: Unidade Centro</span>
        </div>

        <div className="header__connection" role="status" aria-label="Status da conexão: segura">
          <span className="header__connection-dot" aria-hidden="true"></span>
          <span>Conexão Segura</span>
        </div>

        <ThemeToggle />

        <button type="button" className="header__icon-btn" aria-label="Notificações">
          <Bell size={20} aria-hidden="true" />
        </button>

        <button type="button" className="header__avatar" aria-label="Menu do perfil do usuário">
          <User size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
