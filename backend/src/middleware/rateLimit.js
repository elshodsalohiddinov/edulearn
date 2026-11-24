// So'rovlar sonini cheklash: parolni "ko'r-ko'rona terish" (brute force) va spamdan himoya.
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const json = (message) => ({ success: false, message });

// Testlarda cheklov o'chiriladi, aks holda testlar o'zi bloklanib qoladi.
const skip = () => config.isTest;

// Login/ro'yxatdan o'tish: 15 daqiqada bitta IP dan 20 ta urinish
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: json('Juda ko\'p urinish. 15 daqiqadan keyin qayta urinib ko\'ring.'),
});

// Bog'lanish formasi: 1 soatda 10 ta xabar
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: json('Juda ko\'p xabar yuborildi. Keyinroq urinib ko\'ring.'),
});

// Butun API uchun umumiy cheklov
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: json('So\'rovlar juda ko\'p. Biroz kuting.'),
});

module.exports = { authLimiter, contactLimiter, apiLimiter };
