import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.local' });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Lance next dev automatiquement si pas déjà démarré
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Active Firebase Emulator si disponible
      ...(process.env.USE_FIREBASE_EMULATOR === 'true' ? {
        NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: 'localhost',
        NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: '9099',
        NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT: '8080',
      } : {}),
    },
  },
});
