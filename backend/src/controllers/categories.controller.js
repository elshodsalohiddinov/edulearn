// Kategoriyalar — to'liq CRUD (1-resurs). O'qish hamma uchun, o'zgartirish faqat super admin.
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/http');
const { uniqueSlug } = require('../utils/slugify');

// Har bir kategoriyada nechta NASHR QILINGAN kurs borligi
const withCount = { _count: { select: { courses: { where: { status: 'PUBLISHED' } } } } };

const shape = (c) => ({ id: c.id, name: c.name, slug: c.slug, createdAt: c.createdAt, courseCount: c._count?.courses ?? 0 });

// GET /api/v1/categories
async function list(_req, res) {
  const items = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: withCount });
  sendSuccess(res, items.map(shape));
}

// GET /api/v1/categories/:id
async function getOne(req, res) {
  const item = await prisma.category.findUnique({ where: { id: req.valid.params.id }, include: withCount });
  if (!item) throw ApiError.notFound('Kategoriya topilmadi');
  sendSuccess(res, shape(item));
}

async function assertNameFree(name, exceptId) {
  const found = await prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, NOT: exceptId ? { id: exceptId } : undefined } });
  if (found) throw ApiError.conflict('Bunday nomli kategoriya allaqachon bor');
}

// POST /api/v1/categories
async function create(req, res) {
  const { name } = req.valid.body;
  await assertNameFree(name);
  const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.category.findUnique({ where: { slug: s } })));
  const item = await prisma.category.create({ data: { name, slug }, include: withCount });
  sendSuccess(res, shape(item), { status: 201 });
}

// PATCH /api/v1/categories/:id
async function update(req, res) {
  const { id } = req.valid.params;
  const { name } = req.valid.body;
  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) throw ApiError.notFound('Kategoriya topilmadi');
  await assertNameFree(name, id);
  const slug = await uniqueSlug(name, async (s) => {
    const f = await prisma.category.findUnique({ where: { slug: s } });
    return Boolean(f && f.id !== id);
  });
  const item = await prisma.category.update({ where: { id }, data: { name, slug }, include: withCount });
  sendSuccess(res, shape(item));
}

// DELETE /api/v1/categories/:id — ichida kurs bo'lsa o'chirilmaydi (409)
async function remove(req, res) {
  const { id } = req.valid.params;
  const item = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { courses: true } } } });
  if (!item) throw ApiError.notFound('Kategoriya topilmadi');
  if (item._count.courses > 0) {
    throw ApiError.conflict(`Bu kategoriyada ${item._count.courses} ta kurs bor. Avval ularni boshqa kategoriyaga o'tkazing.`);
  }
  await prisma.category.delete({ where: { id } });
  res.status(204).end();
}

module.exports = { list, getOne, create, update, remove };
