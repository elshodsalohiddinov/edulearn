// Autentifikatsiya (kimligini aniqlash) va avtorizatsiya (RBAC — rolga qarab ruxsat).
//
// Token qayerda? JWT HttpOnly cookie ichida. JavaScript uni o'qiy olmaydi,
// shuning uchun XSS hujumida token o'g'irlanmaydi. Token URL'da ham, localStorage'da ham yo'q.
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { PUBLIC_USER_SELECT } = require('../utils/roles');

const cookieOptions = () => ({
  httpOnly: true, // JS (document.cookie) orqali o'qib bo'lmaydi
  secure: config.isProd || config.cookieSameSite === 'none', // productionda faqat HTTPS
  sameSite: config.cookieSameSite, // 'lax' — boshqa saytdan kelgan POST so'rovga cookie qo'shilmaydi (CSRF himoyasi)
  path: '/',
});

function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  res.cookie(config.cookieName, token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, cookieOptions());
}

// Token bo'lsa foydalanuvchini bazadan oladi. Rol TOKEN'dan emas, BAZADAN olinadi —
// admin rolni o'zgartirsa yoki akkauntni bloklasa, darhol kuchga kiradi.
async function loadUser(req) {
  const token = req.cookies?.[config.cookieName];
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return null; // muddati o'tgan yoki soxta token
  }
  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) }, select: PUBLIC_USER_SELECT });
  if (!user || !user.isActive) return null;
  return user;
}

// Kirish ixtiyoriy (masalan kurslar katalogi): bo'lsa req.user, bo'lmasa mehmon.
async function optionalAuth(req, _res, next) {
  req.user = await loadUser(req);
  next();
}

// Kirish majburiy: token yo'q / yaroqsiz / akkaunt bloklangan -> 401
async function authenticate(req, res, next) {
  const user = await loadUser(req);
  if (!user) {
    if (req.cookies?.[config.cookieName]) clearAuthCookie(res);
    throw ApiError.unauthorized();
  }
  req.user = user;
  next();
}

// Rol tekshiruvi: requireRole('TEACHER', 'SUPER_ADMIN'). Boshqa rollarga 403.
// Frontendda menyuni yashirish xavfsizlik EMAS — haqiqiy tekshiruv shu yerda.
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}

module.exports = { authenticate, optionalAuth, requireRole, setAuthCookie, clearAuthCookie };
