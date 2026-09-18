import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
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
    kpis,
    isLoading,
    isFetching,
    isError,
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
              Erro ao carregar os dados. Verifique sua conexão com o servidor.
            </div>
          )}

          <Table 
            data={currentData} 
            isLoading={isLoading} 
            isFetching={isFetching}
            onViewDetails={(solicitacao) => setSelectedSolicitacao(solicitacao)}
          />

          <Pagination 
            pagination={paginationData}
            onPageChange={setCurrentPage}
            isFetching={isFetching}
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
