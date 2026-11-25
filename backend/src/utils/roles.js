// Rollar bitta joyda — matnni qo'lda yozib xato qilmaslik uchun.
const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  SUPER_ADMIN: 'SUPER_ADMIN',
});

// Foydalanuvchini javobga qo'shishdan oldin maxfiy maydonlarni olib tashlaydi.
// passwordHash HECH QACHON frontendga yuborilmaydi.
function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

// Prisma `select` — faqat xavfsiz maydonlar
const PUBLIC_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  bio: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
};

// Boshqa foydalanuvchilarga ko'rinadigan (email'siz) qisqa ma'lumot
const TEACHER_BRIEF_SELECT = { id: true, firstName: true, lastName: true, avatarUrl: true, bio: true };

module.exports = { ROLES, publicUser, PUBLIC_USER_SELECT, TEACHER_BRIEF_SELECT };
