import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { ListRefreshBanner } from './components/ListRefreshBanner';
import { Table } from './components/Table';
import { Pagination } from './components/Pagination';
import { CreateSolicitacaoModal } from './components/CreateSolicitacaoModal';
import { SolicitacaoDetailModal } from './components/SolicitacaoDetailModal';
import { useSolicitacoes } from './hooks/useSolicitacoes';
import type { Solicitacao } from './types';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  
  const { 
    filtros, 
    setFiltros, 
    currentData, 
    paginationData, 
    setCurrentPage,
    prefetchPage,
    kpis,
    isLoading,
    isListRefreshing,
    isError,
    loadErrorMessage,
    isSearchPending,
    periodoError,
    resetListToDefault,
  } = useSolicitacoes();

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Ir para o conteúdo principal</a>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <Header
        isMenuOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen((open) => !open)}
      />

      <main id="main-content" className="main" role="main">
          <header className="main__header">
            <h1 className="main__title">Solicitações</h1>
          </header>

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
            onCreateClick={() => setIsCreateModalOpen(true)}
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
            onPrefetchPage={prefetchPage}
            isFetching={isListRefreshing}
          />
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
