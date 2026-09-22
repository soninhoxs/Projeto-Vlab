import { useEffect, useState } from 'react';
import { Sidebar, type AppView } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { ListRefreshBanner } from './components/ListRefreshBanner';
import { Table } from './components/Table';
import { Pagination } from './components/Pagination';
import { CreateSolicitacaoModal } from './components/CreateSolicitacaoModal';
import { SolicitacaoDetailModal } from './components/SolicitacaoDetailModal';
import { abortActiveListFetch } from './api/solicitacoes';
import { useSolicitacoes } from './hooks/useSolicitacoes';
import type { Solicitacao } from './types';

function viewFromHash(): AppView {
  return window.location.hash === '#painel' ? 'painel' : 'fila';
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<AppView>(viewFromHash);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  
  const { 
    filtros, 
    setFiltros, 
    currentData, 
    paginationData, 
    setCurrentPage,
    kpis,
    isLoading,
    isListRefreshing,
    isError,
    loadErrorMessage,
    isSearchPending,
    periodoError,
    resetListToDefault,
  } = useSolicitacoes();

  useEffect(() => {
    const syncView = () => setView(viewFromHash());
    window.addEventListener('hashchange', syncView);
    return () => window.removeEventListener('hashchange', syncView);
  }, []);

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Ir para o conteúdo principal</a>
      <Sidebar isOpen={sidebarOpen} view={view} setIsOpen={setSidebarOpen} />
      <Header
        isMenuOpen={sidebarOpen}
        title={view === 'painel' ? 'Painel' : 'Solicitações'}
        onMenuClick={() => setSidebarOpen((open) => !open)}
      />

      <main id="main-content" className="main" role="main">
          <header className="main__header">
            <h1 className="main__title">{view === 'painel' ? 'Painel' : 'Solicitações'}</h1>
          </header>

          {view === 'painel' ? (
            <Dashboard />
          ) : (
          <>
          <KpiCards 
            total={kpis.total}
            recebidas={kpis.recebidas}
            emAnalise={kpis.emAnalise}
            agendadas={kpis.agendadas}
            urgentes={kpis.urgentes}
          />

          <FilterBar 
            filtros={filtros} 
            setFiltros={setFiltros} 
            onCreateClick={() => {
              abortActiveListFetch();
              setIsCreateModalOpen(true);
            }}
            isSearchPending={isSearchPending}
          />

          {periodoError && (
            <div className="main__alert main__alert--warning" role="alert">
              {periodoError}
            </div>
          )}

          {isError && (
            <div className="main__alert main__alert--error" role="alert">
              {loadErrorMessage}
            </div>
          )}

          <ListRefreshBanner active={isListRefreshing || isSearchPending} />

          <Table 
            data={currentData} 
            isLoading={isLoading} 
            isRefreshing={isListRefreshing}
            onViewDetails={(solicitacao) => setSelectedSolicitacao(solicitacao)}
          />

          <Pagination 
            pagination={paginationData}
            onPageChange={setCurrentPage}
            isFetching={isListRefreshing}
          />
          </>
          )}
      </main>

      {/* Modals */}
      <CreateSolicitacaoModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={resetListToDefault}
      />
      
      <SolicitacaoDetailModal 
        isOpen={selectedSolicitacao !== null}
        onClose={() => setSelectedSolicitacao(null)}
        solicitacaoId={selectedSolicitacao?.id ?? null}
      />
    </div>
  );
}

export default App;
