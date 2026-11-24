// Super admin: statistika, foydalanuvchilar, rollar, kurslar holati, xabarlar.
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginate, pageMeta } = require('../utils/http');
const { ROLES, PUBLIC_USER_SELECT } = require('../utils/roles');
const { toCard, CARD_INCLUDE } = require('./courses.controller');

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

// GET /api/v1/admin/stats — hamma raqamlar bazadan hisoblanadi (soxta statistika yo'q)
async function stats(_req, res) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [byRole, byStatus, enrollments, lessons, unreadMessages, recentEnrollments, categories, topCourses] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.enrollment.count(),
    prisma.lesson.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.enrollment.findMany({ where: { enrolledAt: { gte: sixMonthsAgo } }, select: { enrolledAt: true } }),
    prisma.category.findMany({ select: { name: true, _count: { select: { courses: true } } }, orderBy: { name: 'asc' } }),
    prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5,
      select: { id: true, title: true, slug: true, _count: { select: { enrollments: true } } },
    }),
  ]);

  const roleCount = Object.fromEntries(byRole.map((r) => [r.role, r._count._all]));
  const statusCount = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));

  // Oxirgi 6 oy bo'yicha yozilishlar (grafik uchun)
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], count: 0 });
  }
  for (const e of recentEnrollments) {
    const m = months.find((x) => x.key === `${e.enrolledAt.getFullYear()}-${e.enrolledAt.getMonth()}`);
    if (m) m.count += 1;
  }

  sendSuccess(res, {
    users: {
      total: Object.values(roleCount).reduce((a, b) => a + b, 0),
      students: roleCount.STUDENT || 0,
      teachers: roleCount.TEACHER || 0,
      admins: roleCount.SUPER_ADMIN || 0,
    },
    courses: {
      total: Object.values(statusCount).reduce((a, b) => a + b, 0),
      published: statusCount.PUBLISHED || 0,
      pending: statusCount.PENDING || 0,
      draft: statusCount.DRAFT || 0,
      archived: statusCount.ARCHIVED || 0,
    },
    enrollments,
    lessons,
    unreadMessages,
    enrollmentsByMonth: months.map(({ label, count }) => ({ month: label, count })),
    coursesByCategory: categories.map((c) => ({ name: c.name, count: c._count.courses })),
    topCourses: topCourses.map((c) => ({ id: c.id, title: c.title, slug: c.slug, students: c._count.enrollments })),
  });
}

// GET /api/v1/admin/users?search=&role=&status=&page=
async function users(req, res) {
  const { search, role, status, ...p } = req.valid.query;
  const where = {};
  if (search) {
    where.OR = ['firstName', 'lastName', 'email'].map((f) => ({ [f]: { contains: search, mode: 'insensitive' } }));
  }
  if (role) where.role = role;
  if (status) where.isActive = status === 'active';
  const page = paginate(p);
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: { ...PUBLIC_USER_SELECT, _count: { select: { courses: true, enrollments: true } } },
      orderBy: { id: 'desc' },
      skip: page.skip,
      take: page.take,
    }),
  ]);
  sendSuccess(res, items, { meta: pageMeta(page, total) });
}

// Admin o'zini yoki boshqa super adminni o'zgartira olmaydi (tasodifan tizimdan chiqib qolmaslik uchun)
async function findEditableUser(actor, id) {
  if (id === actor.id) throw ApiError.badRequest('O\'z akkauntingizni bu yerdan o\'zgartira olmaysiz');
  const user = await prisma.user.findUnique({ where: { id }, include: { _count: { select: { courses: true } } } });
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');
  if (user.role === ROLES.SUPER_ADMIN) throw ApiError.forbidden('Super admin akkauntini o\'zgartirib bo\'lmaydi');
  return user;
}

// PATCH /api/v1/admin/users/:id/role — { role: "TEACHER" | "STUDENT" }
async function setRole(req, res) {
  const { id } = req.valid.params;
  const { role } = req.valid.body;
  const user = await findEditableUser(req.user, id);
  if (user.role === ROLES.TEACHER && role === ROLES.STUDENT && user._count.courses > 0) {
    throw ApiError.conflict(`Bu o'qituvchining ${user._count.courses} ta kursi bor. Avval kurslarini o'chiring.`);
  }
  const updated = await prisma.user.update({ where: { id }, data: { role }, select: PUBLIC_USER_SELECT });
  sendSuccess(res, updated);
}

// PATCH /api/v1/admin/users/:id/status — { isActive: false } bloklash
async function setStatus(req, res) {
  const { id } = req.valid.params;
  const { isActive } = req.valid.body;
  await findEditableUser(req.user, id);
  const updated = await prisma.user.update({ where: { id }, data: { isActive }, select: PUBLIC_USER_SELECT });
  sendSuccess(res, updated);
}

// GET /api/v1/admin/courses?search=&status=&page= — barcha holatdagi kurslar
async function courses(req, res) {
  const { search, status, ...p } = req.valid.query;
  const where = {};
  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (status) where.status = status;
  const page = paginate(p);
  const [total, rows] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({ where, include: CARD_INCLUDE, orderBy: { updatedAt: 'desc' }, skip: page.skip, take: page.take }),
  ]);
  sendSuccess(res, rows.map(toCard), { meta: pageMeta(page, total) });
}

// PATCH /api/v1/admin/courses/:id/status — tasdiqlash (PUBLISHED), yashirish (ARCHIVED) va h.k.
async function setCourseStatus(req, res) {
  const { id } = req.valid.params;
  const { status } = req.valid.body;
  const exists = await prisma.course.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw ApiError.notFound('Kurs topilmadi');
  const course = await prisma.course.update({ where: { id }, data: { status }, include: CARD_INCLUDE });
  sendSuccess(res, toCard(course));
}

// GET /api/v1/admin/messages — bog'lanish formasidan kelgan xabarlar
async function messages(req, res) {
  const page = paginate(req.valid.query);
  const [total, items] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, skip: page.skip, take: page.take }),
  ]);
  sendSuccess(res, items, { meta: pageMeta(page, total) });
}

// PATCH /api/v1/admin/messages/:id/read
async function markMessageRead(req, res) {
  const { id } = req.valid.params;
  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg) throw ApiError.notFound('Xabar topilmadi');
  sendSuccess(res, await prisma.contactMessage.update({ where: { id }, data: { isRead: true } }));
}

module.exports = { stats, users, setRole, setStatus, courses, setCourseStatus, messages, markMessageRead };
