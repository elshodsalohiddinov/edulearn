# GitHub Issues ro'yxati

Har bir qatorni GitHub'da alohida Issue qilib oching: **Issues → New issue**. Mas'ul a'zoni **Assignees** ga, haftani **Milestone** ga qo'ying.

Har bir issue uchun alohida branch oching, ishni Pull Request orqali yuboring va PR tavsifiga `Closes #N` yozing. PR'ni boshqa a'zo review qilgandan keyin merge qilinadi.

Belgilar: **TL** — team lead, **BE** — backend, **DB** — ma'lumotlar bazasi, **FE** — frontend.

## Milestone: 11-hafta (28-noyabrgacha)
| # | Issue | Mas'ul | Branch |
|---|---|---|---|
| 1 | Repo tuzilmasi, .gitignore, .env.example, README skeleti | TL | `chore/repo-setup` |
| 2 | DB sxemasi (ERD) va endpointlar ro'yxatini docs/PLAN.md ga yozish | TL + DB | `docs/plan` |
| 3 | Prisma sxemasi: users, categories, courses, lessons, enrollments, lesson_progress | DB | `feature/prisma-schema` |
| 4 | Lokal PostgreSQL skripti va birinchi migratsiya | DB | `feature/local-db` |

## Milestone: 12-hafta
| # | Issue | Mas'ul | Branch |
|---|---|---|---|
| 5 | Express ilova: helmet, cors, cookie-parser, errorHandler, javob formati | BE | `feature/app-setup` |
| 6 | Register / login / logout / me (bcrypt, JWT HttpOnly cookie) | BE | `feature/auth-api` |
| 7 | RBAC middleware (requireRole) va rate limiting | BE | `feature/rbac` |
| 8 | Seed: admin, 3 o'qituvchi, 4 talaba, 5 kategoriya, 10 kurs, darslar | DB | `feature/seed` |
| 9 | Kategoriyalar CRUD API | BE | `feature/categories-api` |
| 10 | Kurslar CRUD API: qidiruv, filtr, saralash, sahifalash, egalik tekshiruvi | BE | `feature/courses-api` |
| 11 | React + Vite + Tailwind, router, AuthContext, axios | FE | `feature/frontend-setup` |
| 12 | Login va Register sahifalari (rol tanlashsiz), ProtectedRoute | FE | `feature/auth-pages` |

## Milestone: 13-hafta (checkpoint 8–10-dekabr)
| # | Issue | Mas'ul | Branch |
|---|---|---|---|
| 13 | Darslar API: CRUD, tartiblash, yopiq dars matnini himoyalash | BE | `feature/lessons-api` |
| 14 | Yozilish va progress API (takroriy yozuvsiz, 0 dars = 0%) | BE + DB | `feature/enrollment-api` |
| 15 | Bosh sahifa (landing) va kurslar katalogi | FE | `feature/landing-catalog` |
| 16 | Kurs sahifasi: syllabus, yozilish tugmasi, preview dars | FE | `feature/course-detail` |
| 17 | Talaba paneli va dars sahifasi (Learn) | FE | `feature/student-panel` |
| 18 | Backend testlari: auth, RBAC, CRUD, enrollment | BE | `test/api` |

## Milestone: 14-hafta (code freeze 19-dekabr)
| # | Issue | Mas'ul | Branch |
|---|---|---|---|
| 19 | O'qituvchi paneli: kurs formasi, darslar boshqaruvi, talabalar | FE | `feature/teacher-panel` |
| 20 | Admin API: stats, users (role/status), courses status, messages | BE + DB | `feature/admin-api` |
| 21 | Admin paneli: statistika grafiklari, foydalanuvchilar, kurslar, kategoriyalar | FE | `feature/admin-panel` |
| 22 | Profil sahifasi va parolni o'zgartirish | FE + BE | `feature/profile` |
| 23 | Responsive, 404/403, loading/empty/error holatlari | FE | `fix/ux-states` |
| 24 | README: o'rnatish, endpointlar, jamoa; Postman to'plami | TL | `docs/readme` |
| 25 | Taqdimot slaydlari (PDF) va demo ssenariysi | TL | — |
| 26 | (Bonus) Deploy: Render + managed PostgreSQL | TL | `chore/deploy` |
