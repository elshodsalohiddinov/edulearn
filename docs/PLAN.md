# EduLearn — loyiha rejasi

Bu hujjat 28-noyabrgacha o'qituvchiga topshiriladigan rejani o'z ichiga oladi: MVP, sahifalar, foydalanuvchi oqimi, RBAC, DB sxemasi, API, papkalar tuzilmasi va jamoaviy ish rejasi.

## A. Loyiha va MVP chegaralari

**Muammo:** talabalar uchun kurslar tarqoq, o'qish jarayonini kuzatish qiyin. O'qituvchiga esa kurs joylab, talabalar natijasini ko'radigan oddiy vosita kerak.

**Yechim:** EduLearn — kurslarga yozilish platformasi. Unda 3 rol bor: talaba, o'qituvchi va super admin.

**MVP'ga kiradi:**
- ro'yxatdan o'tish va kirish (hashlangan parol, HttpOnly cookie JWT), rolga qarab panel;
- kurslar katalogi: qidiruv, kategoriya va daraja bo'yicha filtr, saralash, sahifalash;
- kurs sahifasi: syllabus va ochiq (preview) dars;
- kursga yozilish va chiqish, dars sahifasi, "Tugallandi" tugmasi, progress foizi;
- o'qituvchi uchun: kurs CRUD, darslar CRUD va tartiblash, tekshiruvga yuborish, kurs talabalari;
- admin uchun: statistika (grafiklar), foydalanuvchilar (rol berish, bloklash), kurslarni tasdiqlash yoki yashirish, kategoriyalar CRUD, bog'lanish xabarlari;
- profil: ma'lumotlarni tahrirlash, parolni o'zgartirish;
- telefon va kompyuter uchun moslashuvchan dizayn, loading/empty/error holatlari, 404 va 403 sahifalari.

**MVP'ga kirmaydi (keyingi bosqich):**
- to'lov: hamma kurslar bepul;
- email orqali parol tiklash: sahifada email servisi ulanmagani ochiq aytiladi;
- fayl yuklash: rasm va video URL orqali beriladi;
- sharhlar va reyting, sertifikat PDF, Google orqali kirish.

## B. Sahifalar va foydalanuvchi oqimi

```
Mehmon ──> / (bosh sahifa) ──> /courses (katalog) ──> /courses/:slug (kurs)
   │                                                     │ "Yozilish uchun kiring"
   └──> /register ──(STUDENT)──> /student/dashboard <────┘ /login
                                                  │
/login ──> server rolni bazadan oladi ──┬── STUDENT     -> /student/dashboard
                                        ├── TEACHER     -> /teacher/dashboard
                                        └── SUPER_ADMIN -> /admin/dashboard
```

| Guruh | Sahifalar |
|---|---|
| Ochiq | `/`, `/courses`, `/courses/:slug`, `/teachers`, `/teachers/:id`, `/about`, `/contact`, `/login`, `/register`, `/forgot-password`, `*` (404) |
| Talaba | `/student/dashboard`, `/student/courses`, `/student/my-courses`, `/student/learn/:courseId/:lessonId`, `/student/profile` |
| O'qituvchi | `/teacher/dashboard`, `/teacher/courses`, `/teacher/courses/new`, `/teacher/courses/:id/edit`, `/teacher/courses/:id/lessons`, `/teacher/courses/:id/students`, `/teacher/profile` |
| Admin | `/admin/dashboard`, `/admin/users`, `/admin/courses`, `/admin/categories`, `/admin/messages`, `/admin/profile` |

Ruxsatsiz holatlar:
- kirmagan foydalanuvchi himoyalangan sahifani ochsa, `/login` ga yo'naltiriladi va login'dan keyin o'sha sahifaga qaytariladi;
- roli mos kelmasa, 403 sahifasi ko'rsatiladi.

**Kurs hayot sikli:**
1. O'qituvchi kursni yaratadi — kurs `DRAFT` holatida bo'ladi.
2. Darslarni qo'shib, "Tekshiruvga yuborish" tugmasini bosadi — `PENDING`.
3. Admin "Tasdiqlash" tugmasini bosadi — `PUBLISHED`. Kurs katalogda ko'rinadi va talabalar yozila oladi.
4. Admin xohlagan paytda kursni yashirishi mumkin — `ARCHIVED`.

## C. RBAC jadvali

[README → Rollar va huquqlar](../README.md#rollar-va-huquqlar-rbac) va [README → REST API](../README.md#rest-api) (har bir endpoint qaysi rolga ochiqligi). Kodda: [backend/src/routes/index.js](../backend/src/routes/index.js).

## D. ERD

[README → Ma'lumotlar bazasi](../README.md#malumotlar-bazasi) va [schema.prisma](../backend/prisma/schema.prisma).

One-to-many munosabatlar:
- User (o'qituvchi) → Course
- Category → Course
- Course → Lesson

Many-to-many munosabatlar oraliq jadvallar orqali qurilgan:
- User ↔ Course: `enrollments` jadvali
- User ↔ Lesson: `lesson_progress` jadvali

## E. API

[README → REST API](../README.md#rest-api) va [Postman to'plami](EduLearn.postman_collection.json).

## F. Papkalar tuzilmasi

[README → Loyiha tuzilmasi](../README.md#loyiha-tuzilmasi).

## G. Jamoa va 5 haftalik reja

| Rol | Mas'ul qismlar (fayllar) |
|---|---|
| **Team lead** (+ bitta rol) | GitHub Issues/Projects, PR review va merge, `README.md`, `docs/`, taqdimot, deploy |
| **Backend** | `backend/src/routes`, `controllers`, `middleware`, `validators`, `services`, `tests/` |
| **Ma'lumotlar bazasi** | `backend/prisma/schema.prisma`, `migrations/`, `seed.js`, `scripts/db.mjs`, admin statistikasi so'rovlari |
| **Frontend** | `frontend/src` — sahifalar, komponentlar, API bilan bog'lanish, responsive |

| Hafta | Sana | Natija |
|---|---|---|
| 11 | 23–28-noyabr | Repo, rollar, mavzu, texnologiya, DB sxemasi, endpointlar ro'yxati, Issues — **28-noyabrgacha o'qituvchiga** |
| 12 | 30-noyabr – 5-dekabr | Prisma sxema + seed, auth (register/login/me), RBAC, kategoriyalar va kurslar CRUD, frontend layout va auth sahifalari |
| 13 | 7–12-dekabr | Darslar, yozilish, progress API; katalog, kurs sahifasi, talaba paneli. **Checkpoint (8–10-dekabr):** API ishlaydi, PR'lar bor |
| 14 | 14–19-dekabr | O'qituvchi va admin panellari, testlar, README, slaydlar. **Code freeze 19-dekabr** |
| 15 | 21–26-dekabr | Taqdimot va himoya |

Issue'lar ro'yxati: [ISSUES.md](ISSUES.md).

## H. Namuna loyihani mavzuga ko'chirish

O'qituvchining namuna loyihasi (Universitet kutubxonasi) bilan solishtirish jadvali. 12-hafta tutorial boshida tekshiriladi.

| Savol | Namuna: kutubxona | EduLearn |
|---|---|---|
| Qanday rollar bor? | `student`, `librarian` | `STUDENT`, `TEACHER`, `SUPER_ADMIN` |
| Asosiy obyekt nima? | `books` | `courses` (ichida `lessons`) |
| Bog'lovchi harakat nima? | `loans`: talaba kitobni bron qiladi | `enrollments`: talaba kursga yoziladi; `lesson_progress`: darsni tugatadi |
| Qanday biznes qoida bor? | Nusxa qolmagan bo'lsa 409; bitta kitobni ikki marta olib bo'lmaydi | Bitta kursga ikki marta yozilib bo'lmaydi (409). Faqat `PUBLISHED` kursga yozilish mumkin. Kursni faqat admin nashr qiladi. Yopiq dars matnini faqat yozilgan talaba ko'radi. Progress takrorlanmaydi |
| API jadvali | 11 ta endpoint | [README → REST API](../README.md#rest-api) |

**Uch rolning bog'lanishi (asosiy ssenariy):**

1. O'qituvchi kurs va darslarni yaratadi (`DRAFT`), keyin tekshiruvga yuboradi (`PENDING`).
2. Super admin "Tekshiruvni kutayotgan kurslar" ro'yxatidan kursni tasdiqlaydi (`PUBLISHED`).
3. Talaba kursni katalogda ko'radi, kursga yoziladi va darslarni tugatadi. Progress foizda hisoblanadi.
4. O'qituvchi o'z kursidagi talabalarni va ularning progressini ko'radi.
5. Admin statistikasi yangilanadi. Admin istalgan talabaga o'qituvchi rolini bera oladi yoki uni bloklay oladi, o'zgarish darhol kuchga kiradi.

Bu ssenariy `npm run test:e2e` buyrug'i bilan avtomatik tekshiriladi (37 ta tekshiruv): [backend/scripts/e2e-roles.mjs](../backend/scripts/e2e-roles.mjs).
