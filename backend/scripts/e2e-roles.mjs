// 3 rol integratsiyasi testi: o'qituvchi -> super admin -> talaba -> o'qituvchi/admin.
// Ishlab turgan API'ga haqiqiy so'rovlar yuboradi (seed hisoblari bilan) va oxirida
// yaratilgan vaqtinchalik kursni o'chiradi, o'zgartirilgan foydalanuvchini qaytaradi.
//
//   npm run dev              # boshqa terminalda: baza + API ishlab tursin
//   npm run test:e2e         # shu testni ishga tushirish
//
// API boshqa manzilda bo'lsa: API_URL=http://localhost:3000/api/v1 npm run test:e2e
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Seed parollari backend/.env dan olinadi (kodga yozilmaydi)
const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1)])
);
const BASE = process.env.API_URL || `http://localhost:${env.PORT || 3000}/api/v1`;

let pass = 0;
let fail = 0;
const results = [];

// Har bir foydalanuvchi uchun alohida "brauzer": o'z cookie'sini saqlaydi
function client() {
  let cookie = '';
  return {
    async req(method, url, body) {
      const res = await fetch(BASE + url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const setCookie = res.headers.getSetCookie?.() || [];
      if (setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
      let data = null;
      try {
        data = await res.json();
      } catch {
        // 204 javobida tana bo'lmaydi
      }
      return { status: res.status, data };
    },
  };
}

function check(label, ok, extra = '') {
  if (ok) {
    pass++;
    results.push(`  OK   ${label}`);
  } else {
    fail++;
    results.push(`  FAIL ${label} ${extra}`);
  }
}

const admin = client();
const teacher = client();
const teacher2 = client();
const student = client();
const guest = client();
const other = client();
const login = async (c, email, password) => (await c.req('POST', '/auth/login', { email, password })).status;
const short = (x) => JSON.stringify(x).slice(0, 200);

let courseId;
let otherUserId;
const lessonIds = [];

try {
  check('admin login', (await login(admin, env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD)) === 200);
  check("o'qituvchi login (sardor)", (await login(teacher, 'sardor@edulearn.uz', env.SEED_DEMO_PASSWORD)) === 200);
  check("2-o'qituvchi login (dilnoza)", (await login(teacher2, 'dilnoza@edulearn.uz', env.SEED_DEMO_PASSWORD)) === 200);
  check('talaba login', (await login(student, 'talaba@edulearn.uz', env.SEED_DEMO_PASSWORD)) === 200);

  const statsBefore = (await admin.req('GET', '/admin/stats')).data?.data;
  const categoryId = (await guest.req('GET', '/categories')).data?.data?.[0]?.id;

  // ---- 1. O'qituvchi: kurs va darslar (qoralama) ----
  const title = 'Integratsiya testi ' + Date.now();
  let r = await teacher.req('POST', '/courses', {
    title,
    description: "Uchala rolning bog'lanishini tekshiruvchi vaqtinchalik kurs.",
    categoryId,
    level: 'BEGINNER',
    status: 'DRAFT',
  });
  check("o'qituvchi kurs yaratdi (201, DRAFT)", r.status === 201 && r.data?.data?.status === 'DRAFT', short(r.data));
  courseId = r.data?.data?.id;
  for (const [i, isPreview] of [[1, true], [2, false]]) {
    r = await teacher.req('POST', `/courses/${courseId}/lessons`, {
      title: `${i}-dars: sinov`,
      content: `Dars ${i} matni`,
      durationMinutes: 5,
      isPreview,
    });
    check(`o'qituvchi ${i}-darsni qo'shdi (201)`, r.status === 201, short(r.data));
    lessonIds.push(r.data?.data?.id);
  }
  check("talaba DRAFT kursni ko'rmaydi (404)", (await student.req('GET', `/courses/${courseId}`)).status === 404);
  check('talaba DRAFT kursga yozila olmaydi', [403, 404, 409].includes((await student.req('POST', `/courses/${courseId}/enroll`)).status));
  check("boshqa o'qituvchi bu kursni tahrirlay olmaydi (403)", (await teacher2.req('PATCH', `/courses/${courseId}`, { title: 'Begona tahrir' })).status === 403);

  // ---- 2. O'qituvchi tekshiruvga yuboradi, admin tasdiqlaydi ----
  r = await teacher.req('PATCH', `/courses/${courseId}`, { status: 'PENDING' });
  check("o'qituvchi tekshiruvga yubordi (PENDING)", r.status === 200 && r.data?.data?.status === 'PENDING', short(r.data));
  check("o'qituvchi o'zi PUBLISHED qila olmaydi (422)", (await teacher.req('PATCH', `/courses/${courseId}`, { status: 'PUBLISHED' })).status === 422);
  r = await admin.req('GET', '/admin/courses?status=PENDING&limit=50');
  check("admin 'tekshiruvni kutayotgan' ro'yxatida ko'radi", (r.data?.data || []).some((c) => c.id === courseId));
  r = await admin.req('PATCH', `/admin/courses/${courseId}/status`, { status: 'PUBLISHED' });
  check('admin tasdiqladi (PUBLISHED)', r.status === 200 && r.data?.data?.status === 'PUBLISHED', short(r.data));

  // ---- 3. Mehmon va talaba ----
  r = await guest.req('GET', `/courses?search=${encodeURIComponent(title)}`);
  check("mehmon katalogda kursni ko'radi", (r.data?.data || []).some((c) => c.id === courseId));
  const lessons = (await guest.req('GET', `/courses/${courseId}/lessons`)).data?.data || [];
  check(
    'mehmon: preview dars ochiq, yopiq dars matni yashirin',
    lessons.length === 2 && lessons[0].content && lessons[1].locked === true && lessons[1].content == null,
    short(lessons)
  );
  check('talaba kursga yozildi (201)', (await student.req('POST', `/courses/${courseId}/enroll`)).status === 201);
  check('takroriy yozilish (409)', (await student.req('POST', `/courses/${courseId}/enroll`)).status === 409);
  r = await student.req('GET', `/courses/${courseId}/lessons`);
  check("yozilgan talaba yopiq dars matnini ko'radi", (r.data?.data || [])[1]?.content === 'Dars 2 matni');
  check('talaba 1-darsni tugatdi', (await student.req('PATCH', `/lessons/${lessonIds[0]}/progress`, { completed: true })).status === 200);
  await student.req('PATCH', `/lessons/${lessonIds[0]}/progress`, { completed: true }); // takroriy belgi
  r = await student.req('GET', `/courses/${courseId}/progress`);
  check('progress 50% (takroriy belgi hisobga olinmaydi)', r.data?.data?.percent === 50 && r.data?.data?.completed === 1, short(r.data?.data));
  r = await student.req('GET', '/students/me/enrollments');
  check("talabaning 'kurslarim' ro'yxatida bor", JSON.stringify(r.data?.data || []).includes(`"${title}"`));

  // ---- 4. O'qituvchi va admin natijani ko'radi ----
  r = await teacher.req('GET', `/teacher/courses/${courseId}/students`);
  const studentsJson = JSON.stringify(r.data?.data || []);
  check(
    "o'qituvchi talabani va 50% progressni ko'radi",
    r.status === 200 && studentsJson.includes('talaba@edulearn.uz') && studentsJson.includes('50'),
    studentsJson.slice(0, 300)
  );
  check("boshqa o'qituvchi bu kurs talabalarini ko'ra olmaydi (403)", (await teacher2.req('GET', `/teacher/courses/${courseId}/students`)).status === 403);
  check("admin ham kurs talabalarini ko'ra oladi", (await admin.req('GET', `/teacher/courses/${courseId}/students`)).status === 200);
  const statsAfter = (await admin.req('GET', '/admin/stats')).data?.data;
  check('admin statistikasi yangilandi', JSON.stringify(statsAfter) !== JSON.stringify(statsBefore));

  // ---- 5. Rollar chegarasi ----
  check('talaba admin statistikasiga kira olmaydi (403)', (await student.req('GET', '/admin/stats')).status === 403);
  check('talaba kurs yarata olmaydi (403)', (await student.req('POST', '/courses', { title: 'x' })).status === 403);
  check("o'qituvchi admin foydalanuvchilariga kira olmaydi (403)", (await teacher.req('GET', '/admin/users')).status === 403);
  check('admin kursga yozila olmaydi (403)', (await admin.req('POST', `/courses/${courseId}/enroll`)).status === 403);
  check('mehmon yozila olmaydi (401)', (await guest.req('POST', `/courses/${courseId}/enroll`)).status === 401);

  // ---- 6. Admin rol beradi va bloklaydi (jamshid; oxirida qaytariladi) ----
  r = await admin.req('GET', '/admin/users?search=jamshid');
  otherUserId = (r.data?.data || [])[0]?.id;
  check("admin talabani o'qituvchi qildi", (await admin.req('PATCH', `/admin/users/${otherUserId}/role`, { role: 'TEACHER' })).status === 200);
  await login(other, 'jamshid@edulearn.uz', env.SEED_DEMO_PASSWORD);
  check("yangi o'qituvchi darhol o'qituvchi paneliga kira oladi", (await other.req('GET', '/teacher/courses')).status === 200);
  await admin.req('PATCH', `/admin/users/${otherUserId}/role`, { role: 'STUDENT' });
  check("rol qaytarilgach darhol 403 (rol bazadan o'qiladi)", (await other.req('GET', '/teacher/courses')).status === 403);
  check('admin SUPER_ADMIN rolini bera olmaydi (422)', (await admin.req('PATCH', `/admin/users/${otherUserId}/role`, { role: 'SUPER_ADMIN' })).status === 422);
  await admin.req('PATCH', `/admin/users/${otherUserId}/status`, { isActive: false });
  check("bloklangan foydalanuvchi so'rovlari rad etiladi", [401, 403].includes((await other.req('GET', '/auth/me')).status));
  check('bloklangan foydalanuvchi kira olmaydi', (await login(client(), 'jamshid@edulearn.uz', env.SEED_DEMO_PASSWORD)) !== 200);
} catch (e) {
  fail++;
  results.push('  XATO ' + e.stack);
} finally {
  // ---- Tozalash: bazani test oldidagi holatiga qaytarish ----
  if (otherUserId) await admin.req('PATCH', `/admin/users/${otherUserId}/status`, { isActive: true });
  if (courseId) {
    await student.req('DELETE', `/courses/${courseId}/enroll`);
    const d = await admin.req('DELETE', `/courses/${courseId}`);
    results.push(`  (tozalash: vaqtinchalik kurs o'chirildi -> ${d.status})`);
  }
  console.log(results.join('\n'));
  console.log(`\nJAMI: ${pass} ta o'tdi, ${fail} ta xato`);
  process.exitCode = fail ? 1 : 0;
}
