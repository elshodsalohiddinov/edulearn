// Ko'p joyda ishlatiladigan Zod qoidalari
const { z } = require('zod');

// URL'dagi :id — musbat butun son
const id = z.coerce.number({ message: 'ID son bo\'lishi kerak' }).int().positive({ message: 'ID musbat bo\'lishi kerak' });
const idParam = z.object({ id });

// Sahifalash: ?page=1&limit=12
const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
};

// Matn: bo'sh joylar olib tashlanadi, uzunlik cheklanadi
const text = (min, max, label = 'Maydon') =>
  z.string({ message: `${label} majburiy` })
    .trim()
    .min(min, { message: min === 1 ? `${label} bo'sh bo'lmasligi kerak` : `${label} kamida ${min} ta belgidan iborat bo'lsin` })
    .max(max, { message: `${label} ko'pi bilan ${max} ta belgi` });

// Ixtiyoriy URL ("" yuborilsa null ga aylanadi — maydonni tozalash uchun)
const optionalUrl = z
  .union([z.literal(''), z.null(), z.url({ protocol: /^https?$/, message: 'To\'g\'ri havola kiriting (https://...)' })])
  .optional()
  .transform((v) => (v === '' ? null : v));

const email = z
  .string({ message: 'Email majburiy' })
  .trim()
  .toLowerCase()
  .max(120)
  .pipe(z.email({ message: 'Email noto\'g\'ri formatda' }));

// Parol: kamida 8 belgi, kamida bitta harf va bitta raqam
const password = z
  .string({ message: 'Parol majburiy' })
  .min(8, { message: 'Parol kamida 8 ta belgidan iborat bo\'lsin' })
  .max(100, { message: 'Parol juda uzun' })
  .regex(/[A-Za-z]/, { message: 'Parolda kamida bitta harf bo\'lsin' })
  .regex(/\d/, { message: 'Parolda kamida bitta raqam bo\'lsin' });

module.exports = { z, id, idParam, pagination, text, optionalUrl, email, password };
