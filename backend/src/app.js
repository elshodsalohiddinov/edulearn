// Express ilovasi: xavfsizlik middleware'lari, API marshrutlari, frontend build, xatolar.
// server.js uni ishga tushiradi; testlar esa shu `app` ni to'g'ridan-to'g'ri ishlatadi.
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Render/Railway kabi proksi ortida to'g'ri IP uchun

// Xavfsizlik sarlavhalari (CSP, clickjacking himoyasi va h.k.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameSrc: ['https://www.youtube-nocookie.com', 'https://www.youtube.com', 'https://player.vimeo.com'],
        connectSrc: ["'self'"],
        // Lokal tarmoqda (http://192.168...) ishlashi uchun https ga majburlamaymiz
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS: faqat ruxsat etilgan frontend manzillari, cookie bilan
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/v1', apiLimiter, routes);
app.use('/api', notFound);

// Production: React build (frontend/dist) ni ham shu server tarqatadi — bitta port, bitta domen.
if (fs.existsSync(path.join(config.clientDist, 'index.html'))) {
  app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }));
  // React Router sahifalari (/courses/react, /admin/users ...) — hammasiga index.html
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
}

app.use(errorHandler);

module.exports = app;
