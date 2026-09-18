import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from './Pagination';
import type { PaginationData } from '../types';

const pagination: PaginationData = {
  currentPage: 2,
  totalPages: 5,
  totalItems: 35,
  itemsPerPage: 7,
  pages: [1, 2, 3, 5],
};

describe('Pagination', () => {
  it('marks the current page with aria-current', () => {
    render(
      <Pagination
        pagination={pagination}
        onPageChange={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: /página 2 atual/i })).toHaveAttribute('aria-current', 'page');
  });

  it('does not prefetch the current page on hover', () => {
    const onPrefetchPage = vi.fn();

    render(
      <Pagination
        pagination={pagination}
        onPageChange={() => undefined}
        onPrefetchPage={onPrefetchPage}
      />,
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: /página 2 atual/i }));
    expect(onPrefetchPage).not.toHaveBeenCalled();

    fireEvent.mouseEnter(screen.getByRole('button', { name: /ir para página 3/i }));
    expect(onPrefetchPage).toHaveBeenCalledWith(3);
  });
});
