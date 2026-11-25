// "O'qituvchi bo'lish uchun ariza" oqimi:
//   talaba ariza yuboradi (PENDING) -> super admin qabul qiladi (APPROVED, rol TEACHER bo'ladi)
//                                   -> yoki rad etadi (REJECTED, rol STUDENT bo'lib qoladi)
// Rolni foydalanuvchi o'zi tanlay olmaydi — faqat admin qarori bilan o'zgaradi.
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginate, pageMeta } = require('../utils/http');

const USER_BRIEF = { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true } };

// POST /api/v1/teacher-requests — faqat talaba
async function create(req, res) {
  const userId = req.user.id;
  // Bir vaqtda faqat bitta ko'rib chiqilayotgan ariza bo'lishi mumkin (dublikat yo'q)
  const pending = await prisma.teacherRequest.findFirst({ where: { userId, status: 'PENDING' }, select: { id: true } });
  if (pending) throw ApiError.conflict('Sizning arizangiz allaqachon ko\'rib chiqilmoqda');

  const request = await prisma.teacherRequest.create({ data: { ...req.valid.body, userId } });
  sendSuccess(res, request, { status: 201 });
}

// GET /api/v1/teacher-requests/my — talabaning o'z arizalari (eng yangisi birinchi)
async function mine(req, res) {
  const items = await prisma.teacherRequest.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  sendSuccess(res, items);
}

// GET /api/v1/admin/teacher-requests?status=PENDING&page=1
async function list(req, res) {
  const { status, ...p } = req.valid.query;
  const where = status ? { status } : {};
  const page = paginate(p);
  const [total, items] = await Promise.all([
    prisma.teacherRequest.count({ where }),
    prisma.teacherRequest.findMany({
      where,
      include: { user: USER_BRIEF },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], // PENDING birinchi
      skip: page.skip,
      take: page.take,
    }),
  ]);
  sendSuccess(res, items, { meta: pageMeta(page, total) });
}

// PATCH /api/v1/admin/teacher-requests/:id — { status: "APPROVED" | "REJECTED" }
async function decide(req, res) {
  const { id } = req.valid.params;
  const { status } = req.valid.body;

  const request = await prisma.teacherRequest.findUnique({ where: { id }, include: { user: true } });
  if (!request) throw ApiError.notFound('Ariza topilmadi');
  // Ikki marta tasdiqlash yoki rad etishning oldini olamiz
  if (request.status !== 'PENDING') throw ApiError.conflict('Bu ariza allaqachon ko\'rib chiqilgan');
  if (!request.user.isActive) throw ApiError.conflict('Foydalanuvchi bloklangan');

  // Ariza holati va foydalanuvchi roli bitta tranzaksiyada o'zgaradi: yo ikkalasi, yo hech biri
  const ops = [
    prisma.teacherRequest.update({ where: { id }, data: { status, reviewedAt: new Date() }, include: { user: USER_BRIEF } }),
  ];
  if (status === 'APPROVED' && request.user.role === 'STUDENT') {
    ops.push(prisma.user.update({ where: { id: request.userId }, data: { role: 'TEACHER' } }));
  }
  const [updated] = await prisma.$transaction(ops);
  sendSuccess(res, updated);
}

module.exports = { create, mine, list, decide };
