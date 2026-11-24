// Yagona javob formati:
//   muvaffaqiyat: { success: true, data, meta? }
//   xato:         { success: false, message, errors? }   (errorHandler.js da)
function sendSuccess(res, data, { status = 200, meta } = {}) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

// ?page=2&limit=12 -> Prisma uchun skip/take va javob uchun meta
function paginate({ page = 1, limit = 12 }) {
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

function pageMeta({ page, limit }, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { sendSuccess, paginate, pageMeta };
