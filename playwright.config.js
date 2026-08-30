const { defineConfig, devices } = require('@playwright/test');

const PUERTO = 4173;
const BASE   = 'http://localhost:' + PUERTO;

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'celular',    use: { ...devices['Pixel 5'] } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'node tests/server.js',
    url: BASE,
    reuseExistingServer: true,
    timeout: 20000,
    env: { PORT: String(PUERTO) }
  }
});
