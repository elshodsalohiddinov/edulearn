// Darslar: ro'yxat, qo'shish, tahrirlash, o'chirish, tartiblash.
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/http');
const { canManage, isEnrolled, findVisibleCourse, findManageableCourse } = require('../services/courseAccess');

const ORDER = [{ orderIndex: 'asc' }, { id: 'asc' }];

// GET /api/v1/courses/:courseId/lessons
// Dars matni va videosi faqat: kursga yozilgan talaba, kurs egasi, admin — yoki "preview" dars uchun.
async function listByCourse(req, res) {
  const { courseId } = req.valid.params;
  const course = await findVisibleCourse(req.user, courseId);
  const hasAccess = canManage(req.user, course) || (await isEnrolled(req.user?.id, courseId));

  const lessons = await prisma.lesson.findMany({ where: { courseId }, orderBy: ORDER });
  const items = lessons.map((l) => {
    const open = hasAccess || l.isPreview;
    return {
      id: l.id,
      courseId: l.courseId,
      title: l.title,
      durationMinutes: l.durationMinutes,
      orderIndex: l.orderIndex,
      isPreview: l.isPreview,
      locked: !open,
      content: open ? l.content : null,
      videoUrl: open ? l.videoUrl : null,
    };
  });
  sendSuccess(res, items, { meta: { hasAccess } });
}

// POST /api/v1/courses/:courseId/lessons — faqat kurs egasi (yoki admin)
async function create(req, res) {
  const { courseId } = req.valid.params;
  await findManageableCourse(req.user, courseId);
  const data = req.valid.body;
  if (!data.orderIndex) {
    const last = await prisma.lesson.aggregate({ where: { courseId }, _max: { orderIndex: true } });
    data.orderIndex = (last._max.orderIndex || 0) + 1;
  }
  const lesson = await prisma.lesson.create({ data: { ...data, courseId } });
  sendSuccess(res, lesson, { status: 201 });
}

async function findManageableLesson(user, lessonId) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw ApiError.notFound('Dars topilmadi');
  await findManageableCourse(user, lesson.courseId);
  return lesson;
}

// PATCH /api/v1/lessons/:lessonId
async function update(req, res) {
  const { lessonId } = req.valid.params;
  const data = req.valid.body;
  if (!Object.keys(data).length) throw ApiError.unprocessable('O\'zgartirish uchun maydon yuborilmadi');
  await findManageableLesson(req.user, lessonId);
  const lesson = await prisma.lesson.update({ where: { id: lessonId }, data });
  sendSuccess(res, lesson);
}

// DELETE /api/v1/lessons/:lessonId
async function remove(req, res) {
  const { lessonId } = req.valid.params;
  await findManageableLesson(req.user, lessonId);
  await prisma.lesson.delete({ where: { id: lessonId } });
  res.status(204).end();
}

// PUT /api/v1/courses/:courseId/lessons/order — { lessonIds: [5, 3, 4] } yangi tartib
async function reorder(req, res) {
  const { courseId } = req.valid.params;
  const { lessonIds } = req.valid.body;
  await findManageableCourse(req.user, courseId);

  const existing = await prisma.lesson.findMany({ where: { courseId }, select: { id: true } });
  const ids = new Set(existing.map((l) => l.id));
  if (lessonIds.length !== ids.size || !lessonIds.every((lid) => ids.has(lid))) {
    throw ApiError.unprocessable('Ro\'yxatda shu kursning barcha darslari bir martadan bo\'lishi kerak');
  }
  // Hammasi bitta tranzaksiyada: yo hammasi o'zgaradi, yo hech biri
  await prisma.$transaction(lessonIds.map((lid, i) => prisma.lesson.update({ where: { id: lid }, data: { orderIndex: i + 1 } })));
  const lessons = await prisma.lesson.findMany({ where: { courseId }, orderBy: ORDER });
  sendSuccess(res, lessons);
}

module.exports = { listByCourse, create, update, remove, reorder };
