// Kursga yozilish, kursdan chiqish, progress.
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/http');
const { TEACHER_BRIEF_SELECT } = require('../utils/roles');
const { isEnrolled, findManageableCourse } = require('../services/courseAccess');
const { getCourseProgress, getProgressMap } = require('../services/progress');

// POST /api/v1/courses/:courseId/enroll — faqat talaba, faqat nashr qilingan kursga
async function enroll(req, res) {
  const { courseId } = req.valid.params;
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, status: true } });
  if (!course || course.status !== 'PUBLISHED') throw ApiError.notFound('Kurs topilmadi');
  if (await isEnrolled(req.user.id, courseId)) throw ApiError.conflict('Siz bu kursga allaqachon yozilgansiz');

  // Ikki so'rov bir vaqtda kelsa ham bazadagi UNIQUE(studentId, courseId) takrorlanishga yo'l qo'ymaydi (P2002 -> 409)
  const enrollment = await prisma.enrollment.create({ data: { studentId: req.user.id, courseId } });
  sendSuccess(res, enrollment, { status: 201 });
}

// DELETE /api/v1/courses/:courseId/enroll — kursdan chiqish. Biznes qoidasi: shu kursdagi progress ham o'chiriladi.
async function unenroll(req, res) {
  const { courseId } = req.valid.params;
  const studentId = req.user.id;
  if (!(await isEnrolled(studentId, courseId))) throw ApiError.notFound('Siz bu kursga yozilmagansiz');
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany({ where: { studentId, lesson: { courseId } } }),
    prisma.enrollment.delete({ where: { studentId_courseId: { studentId, courseId } } }),
  ]);
  res.status(204).end();
}

// GET /api/v1/students/me/enrollments — talabaning kurslari va har biri bo'yicha progress
async function myEnrollments(req, res) {
  const studentId = req.user.id;
  const rows = await prisma.enrollment.findMany({
    where: { studentId },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: {
        select: {
          id: true, title: true, slug: true, thumbnailUrl: true, level: true, status: true,
          teacher: { select: TEACHER_BRIEF_SELECT },
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
  const progressOf = await getProgressMap([studentId], rows.map((r) => r.courseId));
  const items = rows.map((r) => ({
    enrollmentId: r.id,
    enrolledAt: r.enrolledAt,
    course: r.course,
    progress: progressOf(studentId, r.courseId),
  }));
  const stats = {
    total: items.length,
    inProgress: items.filter((i) => !i.progress.isCompleted).length,
    completed: items.filter((i) => i.progress.isCompleted).length,
  };
  sendSuccess(res, items, { meta: stats });
}

// GET /api/v1/courses/:courseId/progress — faqat o'zining progressi (boshqa talabaniki ko'rinmaydi)
async function courseProgress(req, res) {
  const { courseId } = req.valid.params;
  if (!(await isEnrolled(req.user.id, courseId))) throw ApiError.forbidden('Siz bu kursga yozilmagansiz');
  sendSuccess(res, await getCourseProgress(req.user.id, courseId));
}

// PATCH /api/v1/lessons/:lessonId/progress — { completed: true | false }
async function setLessonProgress(req, res) {
  const { lessonId } = req.valid.params;
  const { completed } = req.valid.body;
  const studentId = req.user.id;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, courseId: true } });
  if (!lesson) throw ApiError.notFound('Dars topilmadi');
  if (!(await isEnrolled(studentId, lesson.courseId))) throw ApiError.forbidden('Avval kursga yoziling');

  if (completed) {
    // upsert: yozuv bo'lsa hech narsa qilmaydi, bo'lmasa yaratadi — takroriy yozuv paydo bo'lmaydi
    await prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      update: {},
      create: { studentId, lessonId },
    });
  } else {
    await prisma.lessonProgress.deleteMany({ where: { studentId, lessonId } });
  }
  sendSuccess(res, await getCourseProgress(studentId, lesson.courseId));
}

// GET /api/v1/teacher/courses/:courseId/students — kurs egasi (yoki admin) o'z talabalarini ko'radi
async function courseStudents(req, res) {
  const { courseId } = req.valid.params;
  await findManageableCourse(req.user, courseId);
  const rows = await prisma.enrollment.findMany({
    where: { courseId },
    orderBy: { enrolledAt: 'desc' },
    include: { student: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
  });
  const progressOf = await getProgressMap(rows.map((r) => r.studentId), [courseId]);
  sendSuccess(res, rows.map((r) => ({
    enrollmentId: r.id,
    enrolledAt: r.enrolledAt,
    student: r.student,
    progress: progressOf(r.studentId, courseId),
  })));
}

module.exports = { enroll, unenroll, myEnrollments, courseProgress, setLessonProgress, courseStudents };
