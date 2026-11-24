// Kursga kim nima qila olishini aniqlaydigan yagona joy (biznes qoidalari).
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/roles');

// Kursni boshqarish (tahrirlash, dars qo'shish): faqat kurs egasi bo'lgan o'qituvchi yoki super admin.
// Boshqa o'qituvchining kursiga ID bo'yicha kirishga urinish (IDOR) shu yerda to'xtatiladi.
function canManage(user, course) {
  if (!user) return false;
  return user.role === ROLES.SUPER_ADMIN || (user.role === ROLES.TEACHER && course.teacherId === user.id);
}

// Nashr qilinmagan (DRAFT/PENDING/ARCHIVED) kursni faqat egasi va admin ko'radi.
function canView(user, course) {
  return course.status === 'PUBLISHED' || canManage(user, course);
}

async function isEnrolled(userId, courseId) {
  if (!userId) return false;
  const row = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: userId, courseId } },
    select: { id: true },
  });
  return Boolean(row);
}

// Kursni topadi; topilmasa yoki ko'rishga ruxsat yo'q bo'lsa 404
// (ruxsat yo'qligini "403" deb aytsak, yashirin kurs borligi ma'lum bo'lib qoladi).
async function findVisibleCourse(user, courseId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !canView(user, course)) throw ApiError.notFound('Kurs topilmadi');
  return course;
}

async function findManageableCourse(user, courseId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound('Kurs topilmadi');
  if (!canManage(user, course)) throw ApiError.forbidden('Faqat kurs muallifi yoki admin o\'zgartira oladi');
  return course;
}

module.exports = { canManage, canView, isEnrolled, findVisibleCourse, findManageableCourse };
