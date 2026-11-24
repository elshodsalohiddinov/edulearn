// Har bir endpoint uchun kiruvchi ma'lumot sxemalari (validatsiya qoidalari).
const { z, id, pagination, text, optionalUrl, email, password } = require('./common');

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const STATUSES = ['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED'];

// ---------- Auth ----------
// DIQQAT: bu yerda `role` maydoni YO'Q. Zod noma'lum maydonlarni olib tashlaydi,
// shuning uchun { role: "SUPER_ADMIN" } yuborilsa ham u e'tiborga olinmaydi.
const register = z
  .object({
    firstName: text(2, 60, 'Ism'),
    lastName: text(2, 60, 'Familiya'),
    email,
    password,
    confirmPassword: z.string({ message: 'Parolni tasdiqlang' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Parollar mos kelmadi',
  });

const login = z.object({
  email: z.string({ message: 'Email majburiy' }).trim().toLowerCase().min(1, { message: 'Email majburiy' }),
  password: z.string({ message: 'Parol majburiy' }).min(1, { message: 'Parol majburiy' }),
});

// ---------- Profil ----------
const updateMe = z.object({
  firstName: text(2, 60, 'Ism').optional(),
  lastName: text(2, 60, 'Familiya').optional(),
  bio: z.string().trim().max(300, { message: 'Ko\'pi bilan 300 ta belgi' }).optional(),
  avatarUrl: optionalUrl,
});

const changePassword = z
  .object({
    currentPassword: z.string({ message: 'Joriy parolni kiriting' }).min(1, { message: 'Joriy parolni kiriting' }),
    newPassword: password,
    confirmPassword: z.string({ message: 'Parolni tasdiqlang' }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Parollar mos kelmadi' });

// ---------- Kategoriyalar ----------
const category = z.object({ name: text(2, 60, 'Nomi') });

// ---------- Kurslar ----------
const courseQuery = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(), // kategoriya slug yoki id
  level: z.enum(LEVELS, { message: 'Daraja noto\'g\'ri' }).optional(),
  teacher: id.optional(),
  sort: z.enum(['newest', 'oldest', 'popular', 'title'], { message: 'Saralash turi noto\'g\'ri' }).default('newest'),
  ...pagination,
});

const courseCreate = z.object({
  title: text(3, 150, 'Kurs nomi'),
  description: text(10, 5000, 'Tavsif'),
  categoryId: z.coerce.number({ message: 'Kategoriyani tanlang' }).int().positive({ message: 'Kategoriyani tanlang' }),
  level: z.enum(LEVELS, { message: 'Darajani tanlang' }).default('BEGINNER'),
  thumbnailUrl: optionalUrl,
  // O'qituvchi faqat qoralama (DRAFT) yoki tekshiruvga yuborish (PENDING) ni tanlay oladi
  status: z.enum(['DRAFT', 'PENDING'], { message: 'Holat noto\'g\'ri' }).default('DRAFT'),
});

const courseUpdate = courseCreate.partial().extend({
  status: z.enum(['DRAFT', 'PENDING'], { message: 'O\'qituvchi faqat qoralama yoki tekshiruvga yuborishni tanlay oladi' }).optional(),
});

const courseIdOrSlug = z.object({ idOrSlug: z.string().trim().min(1).max(100) });
const courseIdParam = z.object({ courseId: id });

// ---------- Darslar ----------
const lessonCreate = z.object({
  title: text(3, 150, 'Dars nomi'),
  content: z.string({ message: 'Dars matni majburiy' }).trim().min(1, { message: 'Dars matni bo\'sh bo\'lmasligi kerak' }).max(50000),
  videoUrl: optionalUrl,
  durationMinutes: z.coerce.number().int().min(1, { message: 'Kamida 1 daqiqa' }).max(600, { message: 'Ko\'pi bilan 600 daqiqa' }).default(10),
  orderIndex: z.coerce.number().int().min(1).max(1000).optional(),
  isPreview: z.boolean().default(false),
});
const lessonUpdate = lessonCreate.partial();
const lessonIdParam = z.object({ lessonId: id });

const lessonOrder = z.object({ lessonIds: z.array(id, { message: "lessonIds massiv bo'lishi kerak" }).min(1) });
const pageQuery = z.object({ ...pagination });

const progress = z.object({ completed: z.boolean({ message: 'completed true yoki false bo\'lishi kerak' }) });

// ---------- Admin ----------
const userQuery = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(['STUDENT', 'TEACHER', 'SUPER_ADMIN']).optional(),
  status: z.enum(['active', 'blocked']).optional(),
  ...pagination,
});
// SUPER_ADMIN rolini API orqali berib bo'lmaydi — faqat seed/CLI orqali (xavfsizlik siyosati)
const roleUpdate = z.object({ role: z.enum(['STUDENT', 'TEACHER'], { message: 'Rol STUDENT yoki TEACHER bo\'lishi kerak' }) });
const statusUpdate = z.object({ isActive: z.boolean({ message: 'isActive true yoki false bo\'lishi kerak' }) });

const adminCourseQuery = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(STATUSES).optional(),
  ...pagination,
});
const courseStatus = z.object({ status: z.enum(STATUSES, { message: 'Holat noto\'g\'ri' }) });

// ---------- Bog'lanish ----------
const contact = z.object({
  name: text(2, 80, 'Ism'),
  email,
  subject: z.string().trim().max(150).optional(),
  message: text(10, 3000, 'Xabar'),
});

module.exports = {
  LEVELS, STATUSES,
  register, login, updateMe, changePassword,
  category,
  courseQuery, courseCreate, courseUpdate, courseIdOrSlug, courseIdParam,
  lessonCreate, lessonUpdate, lessonIdParam, lessonOrder, progress, pageQuery,
  userQuery, roleUpdate, statusUpdate, adminCourseQuery, courseStatus,
  contact,
};
