# Jamoaga yangi a'zo: boshlash yo'riqnomasi

Jamoada **bitta umumiy repo** bor: https://github.com/elshodsalohiddinov/edulearn. O'z akkauntingizda alohida repo ochish shart emas. Hamma shu repoda ishlaydi, har kim o'z akkauntidan commit va PR qiladi. Har bir talabaning ishi aynan shu GitHub tarixi orqali baholanadi (20 ball).

## 1. Bir martalik sozlash

1. Emailingizga kelgan taklifni qabul qiling yoki shu havolani oching:
   https://github.com/elshodsalohiddinov/edulearn/invitations → **Accept invitation**
2. Git'da GitHub'dagi bilan bir xil ism va emailni ko'rsating:
   ```bash
   git config --global user.name "Ism Familiya"
   git config --global user.email "github-dagi-emailingiz@example.com"
   ```
3. Loyihani yuklab oling va ishga tushiring. Faqat Node.js 20 yoki undan yangi versiyasi kerak, PostgreSQL'ni o'rnatish shart emas:
   ```bash
   git clone https://github.com/elshodsalohiddinov/edulearn.git
   cd edulearn
   npm run setup     # paketlar + backend/.env + baza + test ma'lumotlari
   npm run dev       # http://localhost:5173
   npm test          # testlar o'tishi kerak
   ```
   Test hisoblari README'da yozilgan.

## 2. Har bir vazifa uchun 6 qadam (o'qituvchi tartibi)

```bash
git checkout main && git pull                 # eng yangi versiya
git checkout -b feature/qisqa-nom             # 1) branch
# ... kod yozing, `npm test` bilan tekshiring ...
git add .
git commit -m "feat(api): nima qilganingiz"   # 2) commit
git push -u origin feature/qisqa-nom          # 3) push
```

Keyingi qadamlar GitHub saytida bajariladi:

4. **Pull Request** oching. Tavsifni **o'z so'zingiz bilan** yozing va oxiriga `Closes #N` (Issue raqami) qo'shing.
5. **Boshqa jamoadosh** PR'ni ko'rib chiqadi: *Files changed → Review changes → Approve*. O'z PR'ingizni o'zingiz tasdiqlay olmaysiz.
6. Tasdiqlangandan keyin PR **merge** qilinadi.

Qoidalar:
- `main`'ga to'g'ridan-to'g'ri push qilinmaydi.
- Har hafta kamida bitta PR merge bo'lishi kerak.
- AI ishlatgan bo'lsangiz, README'dagi **AI jurnali** jadvaliga bir qator yozing.

## 3. Backend dasturchi uchun

**Siz himoyada tushuntirib berishingiz kerak bo'lgan fayllar:**

| Fayl | Nima qiladi |
|---|---|
| `backend/src/app.js` | Express ilova: helmet, cors, cookie, marshrutlar, xatolar |
| `backend/src/routes/index.js` | Barcha endpointlar va har biriga kim kira olishi |
| `backend/src/middleware/auth.js` | JWT (HttpOnly cookie), `authenticate`, `requireRole` |
| `backend/src/middleware/validate.js`, `validators/schemas.js` | Zod validatsiyasi va 422 javobi |
| `backend/src/middleware/errorHandler.js` | Hamma xatolarni to'g'ri status kodga aylantirish |
| `backend/src/controllers/*.js` | Har bir resurs uchun biznes-logika |
| `backend/src/services/courseAccess.js` | Kim qaysi kursni ko'ra yoki o'zgartira oladi (egalik tekshiruvi) |
| `backend/tests/*.test.js` | Avtomatik testlar (Vitest + Supertest) |

Ko'p beriladigan savollar va ularning javoblari: [HIMOYA.md](HIMOYA.md).

**Birinchi PR uchun tavsiya — kichik, lekin o'zingiz yozgan vazifa.** Har biri uchun avval GitHub'da Issue oching:

1. **Kursga "til" maydoni** (`uz` / `ru` / `en`). Qadamlar [HIMOYA.md → Jonli topshiriq 1](HIMOYA.md#jonli-topshiriq-namunalari) da yozilgan: Prisma sxemasi, migratsiya, Zod, `toCard`, test.
2. **`GET /api/v1/courses?hasLessons=true` filtri:** faqat darsi bor kurslarni qaytaradi. Shu filtr uchun test ham yozing.
3. **`GET /api/v1/courses/:courseId/lessons/count`:** kursdagi darslar sonini qaytaradi, kurs topilmasa 404.

Ish tugagach, `npm test` hammasi yashil chiqishi kerak. Shundan keyin PR oching.
