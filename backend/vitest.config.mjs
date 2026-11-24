// Testlar alohida "edulearn_test" bazasida ishlaydi — asosiy ma'lumotlarga tegmaydi.
import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './tests/globalSetup.mjs';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true, // describe, it, expect — import qilmasdan
    globalSetup: './tests/globalSetup.mjs',
    env: { NODE_ENV: 'test', DATABASE_URL: testDatabaseUrl() },
    fileParallelism: false, // bitta baza — testlar ketma-ket
    testTimeout: 20000,
    hookTimeout: 120000,
  },
});
