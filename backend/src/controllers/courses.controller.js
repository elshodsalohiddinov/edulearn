// Kurslar — to'liq CRUD (2-resurs).
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginate, pageMeta } = require('../utils/http');
const { uniqueSlug } = require('../utils/slugify');
const { ROLES, TEACHER_BRIEF_SELECT } = require('../utils/roles');
const { canManage, canView, isEnrolled, findManageableCourse } = require('../services/courseAccess');
const { getCourseProgress } = require('../services/progress');

// Kurs kartasi uchun kerakli maydonlar
const CARD_INCLUDE = {
  teacher: { select: TEACHER_BRIEF_SELECT },
  category: { select: { id: true, name: true, slug: true } },
  _count: { select: { lessons: true, enrollments: true } },
};

function toCard(c) {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    // Kartada qisqa tavsif ko'rinadi; eski kurslarda bo'sh bo'lsa to'liq tavsifdan qisqartiramiz
    shortDescription: c.shortDescription || (c.description.length > 180 ? `${c.description.slice(0, 177)}...` : c.description),
    thumbnailUrl: c.thumbnailUrl,
    level: c.level,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    teacher: c.teacher,
    category: c.category,
    lessonCount: c._count.lessons,
    studentCount: c._count.enrollments,
  };
}

const SORTS = {
  newest: [{ createdAt: 'desc' }, { id: 'desc' }],
  oldest: [{ createdAt: 'asc' }, { id: 'asc' }],
  popular: [{ enrollments: { _count: 'desc' } }, { id: 'desc' }],
  title: [{ title: 'asc' }],
};

// Qidiruv/filtr shartlarini Prisma `where` ga aylantiradi
function buildWhere({ search, category, level, teacher }) {
  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { teacher: { firstName: { contains: search, mode: 'insensitive' } } },
      { teacher: { lastName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (category) where.category = /^\d+$/.test(category) ? { id: Number(category) } : { slug: category };
  if (level) where.level = level;
  if (teacher) where.teacherId = teacher;
  return where;
}

// Ro'yxatdagi kurslardan qaysilariga joriy talaba yozilganini belgilaydi
async function markEnrolled(user, cards) {
  if (user?.role !== ROLES.STUDENT || !cards.length) return cards;
  const rows = await prisma.enrollment.findMany({
    where: { studentId: user.id, courseId: { in: cards.map((c) => c.id) } },
    select: { courseId: true },
  });
  const set = new Set(rows.map((r) => r.courseId));
  return cards.map((c) => ({ ...c, isEnrolled: set.has(c.id) }));
}

// GET /api/v1/courses — ommaviy katalog: faqat NASHR QILINGAN kurslar
async function list(req, res) {
  const q = req.valid.query;
  const where = { ...buildWhere(q), status: 'PUBLISHED' };
  const page = paginate(q);
  const [total, rows] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({ where, include: CARD_INCLUDE, orderBy: SORTS[q.sort], skip: page.skip, take: page.take }),
  ]);
  const items = await markEnrolled(req.user, rows.map(toCard));
  sendSuccess(res, items, { meta: pageMeta(page, total) });
}

// GET /api/v1/courses/:idOrSlug — kurs sahifasi (syllabus: darslar ro'yxati, matnsiz)
async function getOne(req, res) {
  const { idOrSlug } = req.valid.params;
  const where = /^\d+$/.test(idOrSlug) ? { id: Number(idOrSlug) } : { slug: idOrSlug };
  const course = await prisma.course.findUnique({
    where,
    include: {
      ...CARD_INCLUDE,
      lessons: {
        select: { id: true, title: true, durationMinutes: true, orderIndex: true, isPreview: true },
        orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      },
    },
  });
  if (!course || !canView(req.user, course)) throw ApiError.notFound('Kurs topilmadi');

  const enrolled = req.user?.role === ROLES.STUDENT ? await isEnrolled(req.user.id, course.id) : false;
  const data = {
    ...toCard(course),
    description: course.description, // to'liq tavsif
    categoryId: course.categoryId,
    teacherId: course.teacherId,
    lessons: course.lessons,
    totalMinutes: course.lessons.reduce((s, l) => s + l.durationMinutes, 0),
    viewer: {
      isEnrolled: enrolled,
      canManage: canManage(req.user, course),
      canEnroll: req.user?.role === ROLES.STUDENT && course.status === 'PUBLISHED' && !enrolled,
      progress: enrolled ? await getCourseProgress(req.user.id, course.id) : null,
    },
  };
  sendSuccess(res, data);
}

async function assertCategory(categoryId) {
  if (categoryId === undefined) return;
  const exists = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!exists) throw ApiError.unprocessable('Kategoriya topilmadi', [{ field: 'categoryId', message: 'Bunday kategoriya yo\'q' }]);
}

const slugTaken = (exceptId) => async (s) => {
  const f = await prisma.course.findUnique({ where: { slug: s }, select: { id: true } });
  return Boolean(f && f.id !== exceptId);
};

// Biznes qoidasi: darsi yo'q kursni nashr qilib bo'lmaydi (talaba bo'sh kursga yozilmasin)
function assertPublishable(lessonCount) {
  if (lessonCount < 1) {
    throw ApiError.unprocessable('Nashr qilish uchun kursda kamida bitta dars bo\'lishi kerak', [
      { field: 'status', message: 'Avval kamida bitta dars qo\'shing' },
    ]);
  }
}

// POST /api/v1/courses — faqat o'qituvchi. Yangi kursda hali dars yo'q,
// shuning uchun u qoralama (DRAFT) bo'lib yaratiladi; darslar qo'shilgach nashr qilinadi.
async function create(req, res) {
  const data = req.valid.body;
  if (data.status === 'PUBLISHED') assertPublishable(0);
  await assertCategory(data.categoryId);
  const slug = await uniqueSlug(data.title, slugTaken());
  const course = await prisma.course.create({
    data: { ...data, slug, teacherId: req.user.id },
    include: CARD_INCLUDE,
  });
  sendSuccess(res, toCard(course), { status: 201 });
}

// PATCH /api/v1/courses/:id — faqat kurs egasi yoki admin
async function update(req, res) {
  const { id } = req.valid.params;
  const data = req.valid.body;
  if (!Object.keys(data).length) throw ApiError.unprocessable('O\'zgartirish uchun maydon yuborilmadi');
  const course = await findManageableCourse(req.user, id);
  if (data.status) {
    // Admin yashirgan kursni o'qituvchi o'zi qayta ocholmaydi
    if (course.status === 'ARCHIVED' && req.user.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Bu kurs administrator tomonidan yashirilgan. Admin bilan bog\'laning.');
    }
    if (data.status === 'PUBLISHED') assertPublishable(await prisma.lesson.count({ where: { courseId: id } }));
  }
  await assertCategory(data.categoryId);
  if (data.title && data.title !== course.title) data.slug = await uniqueSlug(data.title, slugTaken(id));
  const updated = await prisma.course.update({ where: { id }, data, include: CARD_INCLUDE });
  sendSuccess(res, toCard(updated));
}

// DELETE /api/v1/courses/:id — darslar, yozilishlar va progress ham o'chadi (onDelete: Cascade)
async function remove(req, res) {
  const { id } = req.valid.params;
  await findManageableCourse(req.user, id);
  await prisma.course.delete({ where: { id } });
  res.status(204).end();
}

// GET /api/v1/teacher/courses — o'qituvchining barcha (har qanday holatdagi) kurslari
async function teacherCourses(req, res) {
  const rows = await prisma.course.findMany({
    where: { teacherId: req.user.id },
    include: CARD_INCLUDE,
    orderBy: { updatedAt: 'desc' },
  });
  sendSuccess(res, rows.map(toCard));
}

module.exports = { list, getOne, create, update, remove, teacherCourses, toCard, CARD_INCLUDE };
