import React from 'react';
import { Search, Plus } from 'lucide-react';
import type { Filtros } from '../types';
import { FilterSelect } from './FilterSelect';
import { FilterDateRange } from './FilterDateRange';

interface FilterBarProps {
  filtros: Filtros;
  setFiltros: React.Dispatch<React.SetStateAction<Filtros>>;
  onCreateClick: () => void;
  isSearchPending?: boolean;
}

const CATEGORIA_OPTIONS = [
  { value: 'todas', label: 'Categoria: Todas' },
  { value: 'CONSULTA', label: 'Consulta' },
  { value: 'EXAME', label: 'Exame' },
  { value: 'VACINACAO', label: 'Vacinação' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

const PRIORIDADE_OPTIONS = [
  { value: 'todas', label: 'Prioridade: Todas' },
  { value: 'URGENTE', label: 'Urgente' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'BAIXA', label: 'Baixa' },
] as const;

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Status: Todos' },
  { value: 'RECEBIDA', label: 'Recebida' },
  { value: 'EM_ANALISE', label: 'Em Análise' },
  { value: 'AGENDADA', label: 'Agendada' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
] as const;

export const FilterBar: React.FC<FilterBarProps> = ({
  filtros,
  setFiltros,
  onCreateClick,
  isSearchPending,
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFiltros((prev) => ({ ...prev, busca: value }));
  };

  return (
    <section className="filter-bar" aria-label="Filtros de solicitações">
      <div className={`filter-bar__search${isSearchPending ? ' filter-bar__search--pending' : ''}`}>
        <Search className="filter-bar__search-icon" size={16} aria-hidden="true" />
        <label htmlFor="filter-search" className="sr-only">
          Buscar por nome ou protocolo
        </label>
        <input
          type="search"
          id="filter-search"
          name="busca"
          className="filter-bar__search-input"
          placeholder="Buscar por nome ou protocolo..."
          autoComplete="off"
          maxLength={100}
          value={filtros.busca}
          onChange={handleSearchChange}
          aria-busy={isSearchPending}
        />
      </div>

      <FilterSelect
        id="filter-categoria"
        label="Filtrar por categoria"
        value={filtros.categoria}
        options={[...CATEGORIA_OPTIONS]}
        onChange={(value) => setFiltros((prev) => ({ ...prev, categoria: value }))}
      />

      <FilterSelect
        id="filter-prioridade"
        label="Filtrar por prioridade"
        value={filtros.prioridade}
        options={[...PRIORIDADE_OPTIONS]}
        onChange={(value) => setFiltros((prev) => ({ ...prev, prioridade: value }))}
      />

      <FilterSelect
        id="filter-status"
        label="Filtrar por status"
        value={filtros.status}
        options={[...STATUS_OPTIONS]}
        onChange={(value) => setFiltros((prev) => ({ ...prev, status: value }))}
      />

      <FilterDateRange
        dataInicio={filtros.dataInicio}
        dataFim={filtros.dataFim}
        onChange={(dataInicio, dataFim) =>
          setFiltros((prev) => ({ ...prev, dataInicio, dataFim }))
        }
      />

      <div className="filter-bar__action">
        <button
          type="button"
          className="btn btn--primary"
          id="btn-nova-solicitacao"
          onClick={onCreateClick}
        >
          <Plus size={20} aria-hidden="true" />
          <span>Nova Solicitação</span>
        </button>
      </div>
    </section>
  );
};
