import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.local' });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Garde-fou : les E2E ne doivent JAMAIS taper la prod Firestore (lectures facturées).
// L'émulateur est actif par défaut ; il faut explicitement USE_FIREBASE_EMULATOR=false
// (en connaissance de cause) pour viser une vraie base.
const USE_EMULATOR = process.env.USE_FIREBASE_EMULATOR !== 'false';
if (!USE_EMULATOR && !process.env.PLAYWRIGHT_BASE_URL) {
  throw new Error(
    'E2E bloqués : émulateur Firebase désactivé sans PLAYWRIGHT_BASE_URL explicite.\n' +
    'Lance l\'émulateur (firebase emulators:start) puis relance les tests,\n' +
    'ou exporte PLAYWRIGHT_BASE_URL pour cibler un environnement dédié.'
  );
}

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
      // Émulateur Firebase actif par défaut (désactivable via USE_FIREBASE_EMULATOR=false).
      ...(USE_EMULATOR ? {
        NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: 'localhost',
        NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: '9099',
        NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT: '8080',
      } : {}),
    },
  },
});
