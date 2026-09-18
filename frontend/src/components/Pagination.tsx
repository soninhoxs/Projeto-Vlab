import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationData } from '../types';

interface PaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  onPrefetchPage?: (page: number) => void;
  isFetching?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onPrefetchPage,
  isFetching,
}) => {
  const { currentPage, totalPages, totalItems, itemsPerPage, pages } = pagination;
  
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <footer className="pagination" aria-label="Paginação da tabela" aria-busy={isFetching}>
      <div className="pagination__info" aria-live="polite">
        Mostrando <strong>{startItem}</strong> a <strong>{endItem}</strong> de <strong>{totalItems}</strong> solicitações
      </div>

      <nav className="pagination__controls" aria-label="Navegação de páginas">
        <button
          type="button"
          className="pagination__btn"
          aria-label="Página anterior"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          onMouseEnter={() => {
            if (currentPage > 1) onPrefetchPage?.(currentPage - 1);
          }}
          onFocus={() => {
            if (currentPage > 1) onPrefetchPage?.(currentPage - 1);
          }}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>

        <ul className="pagination__list">
          {pages.map((page, index) => {
            if (page === -1) {
              return (
                <li key={`ellipsis-${index}`} className="pagination__ellipsis" aria-hidden="true">
                  ...
                </li>
              );
            }

            return (
              <li key={page}>
                <button
                  type="button"
                  className={`pagination__page ${currentPage === page ? 'pagination__page--active' : ''}`}
                  aria-label={currentPage === page ? `Página ${page} atual` : `Ir para página ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                  onClick={() => onPageChange(page)}
                  onMouseEnter={() => {
                    if (page !== currentPage) onPrefetchPage?.(page);
                  }}
                  onFocus={() => {
                    if (page !== currentPage) onPrefetchPage?.(page);
                  }}
                >
                  {page}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="pagination__btn"
          aria-label="Próxima página"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          onMouseEnter={() => {
            if (currentPage < totalPages) onPrefetchPage?.(currentPage + 1);
          }}
          onFocus={() => {
            if (currentPage < totalPages) onPrefetchPage?.(currentPage + 1);
          }}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </nav>
    </footer>
  );
};
