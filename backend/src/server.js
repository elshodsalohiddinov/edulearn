// Serverni ishga tushirish nuqtasi: npm run dev / npm start
const os = require('node:os');
const app = require('./app');
const config = require('./config/env');
const prisma = require('./lib/prisma');

// Baza endigina ishga tushayotgan bo'lishi mumkin — 20 soniyagacha kutamiz
async function waitForDatabase(attempts = 20) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      if (i === attempts) {
        console.error('Ma\'lumotlar bazasiga ulanib bo\'lmadi. PostgreSQL ishlayaptimi? (npm run db)');
        console.error(err.message);
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function main() {
  await waitForDatabase();

  // 0.0.0.0 — lokal tarmoqdagi boshqa qurilmalar ham ulana olsin
  app.listen(config.port, '0.0.0.0', () => {
    const lan = Object.values(os.networkInterfaces()).flat()
      .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
    console.log(`EduLearn API: http://localhost:${config.port}/api/v1`);
    if (lan) console.log(`Lokal tarmoq:  http://${lan}:${config.port}`);
  });
}

main();
