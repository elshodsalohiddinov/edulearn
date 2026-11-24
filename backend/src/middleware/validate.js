// Zod sxemasi bilan kiruvchi ma'lumotni tekshiradi.
// Xato bo'lsa 422 va har bir maydon bo'yicha xabar qaytadi:
//   { success:false, message:"Ma'lumotlar noto'g'ri", errors:[{ field:"email", message:"..." }] }
// To'g'ri bo'lsa tozalangan (trim qilingan, son ga o'girilgan) qiymatlar req.valid ga yoziladi.
const ApiError = require('../utils/ApiError');

function formatIssues(issues) {
  return issues.map((i) => ({ field: i.path.join('.') || '_', message: i.message }));
}

function validate(schemas) {
  return (req, _res, next) => {
    req.valid = req.valid || {};
    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (!result.success) {
        // URL'dagi noto'g'ri ID (masalan /courses/abc) — bu 400, forma xatolari esa 422
        const status = part === 'params' ? 400 : 422;
        throw new ApiError(status, part === 'params' ? 'Noto\'g\'ri manzil parametri' : 'Ma\'lumotlar noto\'g\'ri', formatIssues(result.error.issues));
      }
      req.valid[part] = result.data;
    }
    next();
  };
}

module.exports = { validate, formatIssues };
