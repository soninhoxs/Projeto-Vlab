import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'php artisan serve --host=127.0.0.1 --port=8000',
      cwd: '../backend',
      url: 'http://127.0.0.1:8000/up',
      reuseExistingServer: !process.env.E2E_START_SERVERS,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --host localhost --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.E2E_START_SERVERS,
      timeout: 120_000,
      env: {
        VITE_API_URL: 'http://localhost:8000/api/v1',
      },
    },
  ],
});
