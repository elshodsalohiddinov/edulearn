// Markaziy xato qayta ishlovchi. Har qanday xato shu yerga keladi va
// { success:false, message, errors? } ko'rinishida to'g'ri status kod bilan qaytadi.
// Ichki tafsilotlar (stack, SQL) foydalanuvchiga ko'rsatilmaydi — faqat server logida.
const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');

function notFound(req, _res, next) {
  next(ApiError.notFound(`Bunday endpoint yo'q: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = 500;
  let message = 'Serverda ichki xato yuz berdi';
  let errors;

  if (err instanceof ApiError) {
    ({ status, message, errors } = err);
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON formati noto\'g\'ri';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'So\'rov hajmi juda katta';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Bazadagi cheklovlar buzilganda
    if (err.code === 'P2002') {
      status = 409;
      message = 'Bunday qiymat allaqachon mavjud';
      errors = (err.meta?.target || []).map?.((f) => ({ field: f, message: 'Band' }));
    } else if (err.code === 'P2025') {
      status = 404;
      message = 'Topilmadi';
    } else if (err.code === 'P2003') {
      status = 409;
      message = 'Bog\'liq ma\'lumotlar bor, avval ularni o\'zgartiring';
    }
  }

  if (status >= 500) console.error(err);

  const body = { success: false, message };
  if (errors && errors.length) body.errors = errors;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
