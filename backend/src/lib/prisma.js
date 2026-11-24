// Butun ilova uchun bitta Prisma client (har so'rovda yangi ulanish ochmaslik uchun).
// Prisma 7 PostgreSQL bilan `pg` drayveri (adapter) orqali ishlaydi.
// Prisma barcha so'rovlarni parametrlangan holda yuboradi — SQL injection xavfi yo'q.
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const config = require('../config/env');

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

const prisma = new PrismaClient({
  adapter,
  log: config.isProd || config.isTest ? ['error'] : ['warn', 'error'],
});

module.exports = prisma;
