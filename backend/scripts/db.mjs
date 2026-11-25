// Lokal PostgreSQL serverini ishga tushiradi (o'rnatish va admin huquqi shart emas).
// `embedded-postgres` paketi PostgreSQL'ning haqiqiy dasturini node_modules ichida saqlaydi.
// Ma'lumotlar backend/.pgdata papkasida turadi (u .gitignore da).
//
// Ishga tushirish:  npm run db:start      (to'xtatish: Ctrl+C)
// Agar kompyuterda o'zingizning PostgreSQL bo'lsa, bu skript shart emas —
// shunchaki .env dagi DATABASE_URL ni o'zingiznikiga moslang.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import EmbeddedPostgres from 'embedded-postgres';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env'), quiet: true });

const url = new URL(process.env.DATABASE_URL);
const dataDir = path.join(root, '.pgdata');
const databases = [url.pathname.slice(1), `${url.pathname.slice(1)}_test`];

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port: Number(url.port) || 5432,
  persistent: true,
  onLog: () => {},
  onError: (e) => console.error(String(e)),
});

const firstRun = !fs.existsSync(path.join(dataDir, 'PG_VERSION'));
if (firstRun) {
  console.log('PostgreSQL birinchi marta sozlanmoqda...');
  await pg.initialise();
}
await pg.start();

for (const name of databases) {
  try {
    await pg.createDatabase(name);
    console.log(`Baza yaratildi: ${name}`);
  } catch {
    // baza allaqachon bor
  }
}

console.log(`PostgreSQL ishlayapti: localhost:${url.port} (bazalar: ${databases.join(', ')})`);
console.log('To\'xtatish uchun Ctrl+C bosing.');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
