// Muhit o'zgaruvchilari (.env) shu yerda bir marta o'qiladi va tekshiriladi.
// Boshqa fayllar process.env ga to'g'ridan-to'g'ri murojaat qilmaydi — faqat `config` orqali.
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`.env faylida ${name} topilmadi. backend/.env.example dan nusxa oling.`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (isProd && jwtSecret.length < 32) {
  throw new Error('Productionda JWT_SECRET kamida 32 belgidan iborat bo\'lishi kerak.');
}

const config = {
  isProd,
  isTest,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: 'edulearn_token',
  // Frontend boshqa domenda bo'lsa (masalan Vercel + Render) "none" qilinadi va HTTPS shart.
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // React build (frontend/dist) — productionda backend uni ham tarqatadi (bitta port).
  clientDist: path.resolve(__dirname, '../../../frontend/dist'),
};

module.exports = config;
