// Progress hisoblash: tugatilgan darslar / jami darslar * 100.
// Jami dars 0 bo'lsa — 0% (nolga bo'lish xatosi bo'lmasligi uchun).
const prisma = require('../lib/prisma');

function percent(completed, total) {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

async function getCourseProgress(studentId, courseId) {
  const [lessons, done] = await Promise.all([
    prisma.lesson.findMany({ where: { courseId }, select: { id: true }, orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }] }),
    prisma.lessonProgress.findMany({
      where: { studentId, lesson: { courseId } },
      select: { lessonId: true },
    }),
  ]);
  const completedIds = new Set(done.map((d) => d.lessonId));
  const nextLesson = lessons.find((l) => !completedIds.has(l.id));
  return {
    courseId,
    total: lessons.length,
    completed: completedIds.size,
    percent: percent(completedIds.size, lessons.length),
    completedLessonIds: [...completedIds],
    nextLessonId: nextLesson?.id ?? lessons[0]?.id ?? null,
    isCompleted: lessons.length > 0 && completedIds.size === lessons.length,
  };
}

// Bir nechta kurs bo'yicha progress (talaba paneli va o'qituvchining talabalar ro'yxati uchun)
async function getProgressMap(studentIds, courseIds) {
  const [lessons, done] = await Promise.all([
    prisma.lesson.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, courseId: true },
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
    }),
    prisma.lessonProgress.findMany({
      where: { studentId: { in: studentIds }, lesson: { courseId: { in: courseIds } } },
      select: { studentId: true, lessonId: true },
    }),
  ]);
  const lessonsByCourse = new Map();
  const courseOfLesson = new Map();
  for (const l of lessons) {
    if (!lessonsByCourse.has(l.courseId)) lessonsByCourse.set(l.courseId, []);
    lessonsByCourse.get(l.courseId).push(l.id);
    courseOfLesson.set(l.id, l.courseId);
  }
  const doneSet = new Set(done.map((d) => `${d.studentId}:${d.lessonId}`));

  return (studentId, courseId) => {
    const ids = lessonsByCourse.get(courseId) || [];
    const completed = ids.filter((lid) => doneSet.has(`${studentId}:${lid}`)).length;
    const next = ids.find((lid) => !doneSet.has(`${studentId}:${lid}`));
    return {
      total: ids.length,
      completed,
      percent: percent(completed, ids.length),
      nextLessonId: next ?? ids[0] ?? null,
      isCompleted: ids.length > 0 && completed === ids.length,
    };
  };
}

module.exports = { percent, getCourseProgress, getProgressMap };
