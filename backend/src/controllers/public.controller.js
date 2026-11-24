// Ochiq (login talab qilmaydigan) ma'lumotlar: o'qituvchilar, umumiy statistika, bog'lanish formasi.
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/http');
const { TEACHER_BRIEF_SELECT } = require('../utils/roles');
const { toCard, CARD_INCLUDE } = require('./courses.controller');

const PUBLISHED = { status: 'PUBLISHED' };

// GET /api/v1/teachers
async function teachers(_req, res) {
  const rows = await prisma.user.findMany({
    where: { role: 'TEACHER', isActive: true },
    select: {
      ...TEACHER_BRIEF_SELECT,
      courses: { where: PUBLISHED, select: { _count: { select: { enrollments: true } } } },
    },
    orderBy: { firstName: 'asc' },
  });
  const items = rows.map(({ courses, ...t }) => ({
    ...t,
    courseCount: courses.length,
    studentCount: courses.reduce((s, c) => s + c._count.enrollments, 0),
  }));
  items.sort((a, b) => b.studentCount - a.studentCount);
  sendSuccess(res, items);
}

// GET /api/v1/teachers/:id — profil va nashr qilingan kurslari
async function teacher(req, res) {
  const t = await prisma.user.findFirst({
    where: { id: req.valid.params.id, role: 'TEACHER', isActive: true },
    select: { ...TEACHER_BRIEF_SELECT, createdAt: true },
  });
  if (!t) throw ApiError.notFound('O\'qituvchi topilmadi');
  const courses = await prisma.course.findMany({
    where: { teacherId: t.id, ...PUBLISHED },
    include: CARD_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  const cards = courses.map(toCard);
  sendSuccess(res, {
    ...t,
    courses: cards,
    courseCount: cards.length,
    studentCount: cards.reduce((s, c) => s + c.studentCount, 0),
  });
}

// GET /api/v1/stats — bosh sahifadagi raqamlar
async function stats(_req, res) {
  const [students, teachersCount, courses, lessons, enrollments] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
    prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
    prisma.course.count({ where: PUBLISHED }),
    prisma.lesson.count({ where: { course: PUBLISHED } }),
    prisma.enrollment.count(),
  ]);
  sendSuccess(res, { students, teachers: teachersCount, courses, lessons, enrollments });
}

// POST /api/v1/contact — xabar bazaga saqlanadi, admin panelda ko'rinadi
async function contact(req, res) {
  const msg = await prisma.contactMessage.create({ data: req.valid.body, select: { id: true, createdAt: true } });
  sendSuccess(res, msg, { status: 201 });
}

module.exports = { teachers, teacher, stats, contact };
