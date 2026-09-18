import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/utils/httpStatus.ts',
        'src/components/CreateSolicitacaoModal.tsx',
        'src/components/SolicitacaoDetailModal.tsx',
        'src/components/Table.tsx',
        'src/components/Pagination.tsx',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
})
