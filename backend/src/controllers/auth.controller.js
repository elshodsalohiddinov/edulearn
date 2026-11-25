// Ro'yxatdan o'tish, kirish, chiqish, joriy foydalanuvchi.
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/http');
const { ROLES, publicUser } = require('../utils/roles');
const { setAuthCookie, clearAuthCookie } = require('../middleware/auth');

const BCRYPT_ROUNDS = 10;

// Mavjud bo'lmagan email bilan kirishda ham bcrypt ishlashi uchun soxta hash —
// aks holda javob vaqtidan "bunday email bor/yo'q"ligini bilib olish mumkin bo'lardi.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

// POST /api/v1/auth/register
async function register(req, res) {
  const { firstName, lastName, email, password } = req.valid.body;

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) throw ApiError.conflict('Bu email bilan allaqachon ro\'yxatdan o\'tilgan');

  // Parol ochiq holda saqlanmaydi — faqat bcrypt hash
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    // Rol har doim STUDENT. O'qituvchi/admin rolini faqat super admin beradi.
    data: { firstName, lastName, email, passwordHash, role: ROLES.STUDENT },
  });

  setAuthCookie(res, user);
  sendSuccess(res, { user: publicUser(user) }, { status: 201 });
}

// POST /api/v1/auth/login
async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await prisma.user.findUnique({ where: { email } });

  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  // Email yoki parol — qaysi biri xatoligini aytmaymiz (xavfsizlik)
  if (!user || !ok) throw ApiError.unauthorized('Email yoki parol noto\'g\'ri');
  if (!user.isActive) throw ApiError.forbidden('Akkauntingiz bloklangan. Administratorga murojaat qiling.');

  // Rol PAROLDAN emas, bazadagi `role` maydonidan olinadi
  setAuthCookie(res, user);
  sendSuccess(res, { user: publicUser(user) });
}

// POST /api/v1/auth/logout
function logout(_req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

// GET /api/v1/auth/me — sahifa yangilanganda frontend kim kirganini shu orqali biladi
function me(req, res) {
  sendSuccess(res, { user: req.user });
}

module.exports = { register, login, logout, me };
