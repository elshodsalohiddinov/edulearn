# Himoyaga tayyorgarlik

Himoyada har bir talaba **faqat o'zi yozgan kod** bo'yicha javob beradi. O'qituvchi repodan sizning PR'ingiz yoki faylingizni ochib so'raydi. Shuning uchun har kim o'z qismidagi fayllarni oxirigacha o'qib chiqishi kerak. Fayllarda o'zbekcha izohlar bor.

## 5 daqiqalik demo ssenariysi

1. **Bosh sahifa:**
   - ro'yxatdan o'tmasdan katalogni ko'rsating, qidiruv va filtrni ishlatib ko'ring;
   - kurs sahifasida ochiq (preview) darsni oching.
2. **Ro'yxatdan o'tish:**
   - yangi talaba hisobini oching — talaba paneli avtomatik ochiladi;
   - kursga yoziling, darsni oching, "Tugallandi" tugmasini bosing va progress foizi o'zgarganini ko'rsating.
3. **O'qituvchi** (`sardor@edulearn.uz`):
   - yangi kurs yarating va unga dars qo'shing;
   - "Tekshiruvga yuborish" tugmasini bosing;
   - "Talabalar" sahifasida talabalarning progressini ko'rsating.
4. **Admin** (`admin@edulearn.uz`):
   - statistika grafiklarini ko'rsating;
   - "Kurslar → Tekshiruvda" bo'limida o'qituvchining kursini tasdiqlang — kurs katalogda paydo bo'ladi;
   - foydalanuvchiga o'qituvchi rolini bering.
5. **Xavfsizlik:** talaba sifatida `/admin/dashboard` ni oching — 403 sahifasi chiqishini ko'rsating.

## Ko'p beriladigan savollar va qisqa javoblar

**Parol qanday saqlanadi?**
`bcrypt.hash(password, 10)` bilan saqlanadi ([auth.controller.js](../backend/src/controllers/auth.controller.js)). Bazada faqat hash turadi, ochiq parolni qayta tiklab bo'lmaydi. Login'da `bcrypt.compare` ishlatiladi.

**Rol qayerdan aniqlanadi?**
Bazadagi `users.role` maydonidan. [auth.js](../backend/src/middleware/auth.js) dagi `loadUser` har bir so'rovda foydalanuvchini bazadan oladi. Ro'yxatdan o'tishda rol doim `STUDENT` bo'ladi: Zod sxemasida `role` maydoni yo'q, shuning uchun yuborilsa ham tashlab yuboriladi.

**Nega token localStorage'da emas?**
HttpOnly cookie'ni JavaScript o'qiy olmaydi. Saytda XSS bo'lsa ham token o'g'irlanmaydi. `SameSite=Lax` esa boshqa saytdan yuborilgan POST so'rovga cookie qo'shilishiga yo'l qo'ymaydi (CSRF'dan himoya).

**Frontendda menyu yashirilgan, bu yetarlimi?**
Yo'q. Haqiqiy tekshiruv backendda — [routes/index.js](../backend/src/routes/index.js) dagi `requireRole(...)`. Talaba `/api/v1/admin/users` ga to'g'ridan-to'g'ri so'rov yuborsa ham 403 oladi. Buni test isbotlaydi: [auth.test.js](../backend/tests/auth.test.js).

**Boshqa o'qituvchining kursini o'zgartira oladimi?**
Yo'q. [courseAccess.js](../backend/src/services/courseAccess.js) dagi `canManage` tekshiradi: `course.teacherId === user.id` yoki foydalanuvchi admin bo'lishi kerak. Aks holda 403 qaytadi.

**Talaba bitta kursga ikki marta yoza oladimi?**
Yo'q, ikki joyda to'xtatiladi:
1. Kodda oldindan tekshiriladi va 409 qaytadi.
2. Bazada `@@unique([studentId, courseId])` cheklovi bor. Ikki so'rov bir vaqtda kelsa ham Prisma P2002 xatosi chiqadi va errorHandler uni 409 ga aylantiradi.

**Progress qanday hisoblanadi?**
Formula: `tugatilgan darslar / jami darslar * 100`. Jami dars 0 bo'lsa natija 0% ([progress.js](../backend/src/services/progress.js)). Darsni qayta "tugatish" `upsert` orqali bajariladi, shuning uchun takroriy yozuv yaratilmaydi.

**Endpointga noto'g'ri ma'lumot yuborilsa nima bo'ladi?**
- Zod validatsiyasidan o'tmasa — 422 va qaysi maydon noto'g'ri ekani ko'rsatiladi.
- Buzilgan JSON — 400.
- URL'dagi noto'g'ri ID (`/courses/abc`) — 400.
- Topilmasa — 404.
- Takroriy ma'lumot — 409.

**Nega Prisma?**
- Sxema bitta faylda turadi va undan migratsiyalar avtomatik yaratiladi.
- So'rovlar parametrlangan, shuning uchun SQL injection xavfi yo'q.
- Munosabatlar (`include`) bilan ishlash qulay.

Boshqa variant: `pg` kutubxonasi bilan qo'lda SQL yozish.

**Kurs o'chirilsa darslari nima bo'ladi?**
`onDelete: Cascade` tufayli darslar, yozilishlar va progress ham o'chadi. O'qituvchi yoki kategoriya uchun esa `Restrict` qo'yilgan: kursi bor kategoriyani o'chirishga urinilsa 409 qaytadi.

## Jonli topshiriq namunalari

### 1. Kursga yangi maydon qo'shish (masalan, `language` — kurs tili)

1. **DB:** [schema.prisma](../backend/prisma/schema.prisma) dagi `Course` modeliga qator qo'shing:
   ```prisma
   language String @default("uz") @db.VarChar(10)
   ```
2. Migratsiya yarating: `npx prisma migrate dev --name add_course_language` (backend papkasida).
3. **Validatsiya:** [schemas.js](../backend/src/validators/schemas.js) dagi `courseCreate` ga qo'shing:
   ```js
   language: z.enum(['uz', 'ru', 'en']).default('uz'),
   ```
   `courseUpdate` avtomatik `partial()` bo'ladi.
4. **Javob:** [courses.controller.js](../backend/src/controllers/courses.controller.js) dagi `toCard` ga `language: c.language` qo'shing.
5. **Frontend:** [TeacherPages.jsx](../frontend/src/pages/teacher/TeacherPages.jsx) dagi `courseSchema` va formaga `<TextField as="select" {...register('language')}>` qo'shing.

### 2. Mavjud endpointga filtr qo'shish (masalan, `/courses?teacher=2`)

Bu filtr allaqachon bor, uning qanday ishlashini tushuntiring:
1. `courseQuery` sxemasida `teacher: id.optional()` qatori bor.
2. `buildWhere` funksiyasi `where.teacherId = teacher` shartini qo'shadi.

Yangi filtr qo'shishning namunasi — "faqat darsi bor kurslar":
```js
// schemas.js -> courseQuery
hasLessons: z.coerce.boolean().optional(),
// courses.controller.js -> buildWhere
if (q.hasLessons) where.lessons = { some: {} };
```

### 3. Yangi endpoint qo'shish (masalan, `GET /api/v1/courses/:courseId/lessons/count`)

```js
// routes/index.js
r.get('/courses/:courseId/lessons/count', validate({ params: s.courseIdParam }), async (req, res) => {
  const count = await prisma.lesson.count({ where: { courseId: req.valid.params.courseId } });
  res.json({ success: true, data: { count } });
});
```

## Kim qaysi fayllarni bilishi shart

| Rol | Fayllar |
|---|---|
| Backend | `src/app.js`, `src/routes/index.js`, `src/middleware/*`, `src/controllers/*`, `src/validators/*`, `tests/*` |
| Ma'lumotlar bazasi | `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.js`, `src/services/progress.js`, `controllers/admin.controller.js` (stats so'rovlari), `scripts/db.mjs` |
| Frontend | `src/app/App.jsx`, `src/contexts/AuthContext.jsx`, `src/services/*`, `src/components/*`, `src/pages/**` |
| Team lead | `README.md`, `docs/*`, GitHub jarayoni, demo ssenariysi va qolgan qismlarning umumiy arxitekturasi |
