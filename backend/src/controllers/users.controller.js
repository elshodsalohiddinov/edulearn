// Joriy foydalanuvchining profili.
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/http');
const { PUBLIC_USER_SELECT } = require('../utils/roles');

// GET /api/v1/users/me
async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { ...PUBLIC_USER_SELECT, _count: { select: { enrollments: true, courses: true } } },
  });
  sendSuccess(res, { user });
}

// PATCH /api/v1/users/me — ism, familiya, bio, avatar. Email va rolni bu yerdan o'zgartirib bo'lmaydi.
async function updateMe(req, res) {
  const data = req.valid.body;
  if (!Object.keys(data).length) throw ApiError.unprocessable('O\'zgartirish uchun maydon yuborilmadi');
  const user = await prisma.user.update({ where: { id: req.user.id }, data, select: PUBLIC_USER_SELECT });
  sendSuccess(res, { user });
}

// PATCH /api/v1/users/me/password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.valid.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw ApiError.unprocessable('Joriy parol noto\'g\'ri', [{ field: 'currentPassword', message: 'Joriy parol noto\'g\'ri' }]);
  }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  res.status(204).end();
}

module.exports = { getMe, updateMe, changePassword };
