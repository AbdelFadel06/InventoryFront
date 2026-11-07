import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

const envFile = resolve(import.meta.dirname, '../.env.e2e');
if (existsSync(envFile)) process.loadEnvFile(envFile);

// Ces tests créent des ventes et des comptes : ils ne doivent jamais viser la prod.
const STAGING_URL = 'https://shopm-staging.abdelsaliou.dev';
if (process.env.E2E_BASE_URL !== STAGING_URL) {
  throw new Error(`E2E_BASE_URL doit valoir ${STAGING_URL}`);
}
if (!process.env.E2E_PASSWORD) {
  throw new Error('E2E_PASSWORD manque dans Frontend2/.env.e2e');
}

export default defineConfig({
  testDir: './tests',
  // Un seul à la fois : les tests partagent les mêmes données de staging.
  workers: 1,
  fullyParallel: false,
  // Le bundle n'est pas compressé : chaque chargement peut prendre 20 s sur une connexion lente.
  timeout: 240_000,
  expect: { timeout: 20_000 },
  // Une seule reprise, pour les coupures réseau ; un échec répété reste un échec.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    navigationTimeout: 120_000,
    actionTimeout: 30_000,
    // Évite que la PWA télécharge tous ses fichiers en arrière-plan pendant le test.
    serviceWorkers: 'block',
    baseURL: STAGING_URL,
    // Utilise le Chrome installé : pas de navigateur à télécharger.
    channel: 'chrome',
    locale: 'fr-FR',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
});
