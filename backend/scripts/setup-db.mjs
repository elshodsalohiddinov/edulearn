// Birinchi marta sozlash (npm run setup oxirida avtomatik ishlaydi):
//   1) backend/.env bo'lmasa — .env.example dan nusxa olib, tasodifiy JWT_SECRET yozadi
//   2) lokal PostgreSQL'ni ishga tushiradi
//   3) migratsiyalarni qo'llaydi va test ma'lumotlarini yuklaydi
//   4) PostgreSQL'ni to'xtatadi
import { execSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(backend, '.env');

if (!fs.existsSync(envFile)) {
  const example = fs.readFileSync(path.join(backend, '.env.example'), 'utf8');
  const secret = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(envFile, example.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`));
  console.log('backend/.env yaratildi (tasodifiy JWT_SECRET bilan).');
}

console.log('PostgreSQL ishga tushirilmoqda...');
const db = spawn(process.execPath, ['scripts/db.mjs'], { cwd: backend, stdio: ['ignore', 'pipe', 'inherit'] });

await new Promise((resolve, reject) => {
  db.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    if (String(chunk).includes('ishlayapti')) resolve();
  });
  db.on('exit', (code) => reject(new Error(`PostgreSQL ishga tushmadi (kod ${code})`)));
});

try {
  const run = (cmd) => execSync(cmd, { cwd: backend, stdio: 'inherit' });
  run('npx prisma migrate deploy');
  run('node prisma/seed.js');
  console.log('\nTayyor! Endi ishga tushiring:  npm run dev   ->  http://localhost:5173');
} finally {
  db.kill('SIGINT');
}
