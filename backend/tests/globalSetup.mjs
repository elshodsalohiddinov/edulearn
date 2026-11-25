// Testlardan oldin bir marta: alohida test bazasiga migratsiyalarni qo'llash va seed yuklash.
// Asosiy "edulearn" bazasiga tegilmaydi — hammasi "edulearn_test" da.
import { execSync } from 'node:child_process';
import dotenv from 'dotenv';

export function testDatabaseUrl() {
  dotenv.config({ quiet: true });
  const url = new URL(process.env.DATABASE_URL);
  if (!url.pathname.endsWith('_test')) url.pathname = `${url.pathname}_test`;
  return url.toString();
}

export default function setup() {
  const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: testDatabaseUrl() };
  execSync('npx prisma migrate deploy', { env, stdio: 'pipe' });
  execSync('node prisma/seed.js', { env, stdio: 'pipe' });
}
