// Kurslar, kategoriyalar, darslar, yozilish va progress testlari
const { API, guest, asStudent, asStudent2, asTeacher, asTeacher2, asAdmin } = require('./helpers');
const prisma = require('../src/lib/prisma');

let categoryId;
beforeAll(async () => {
  categoryId = (await prisma.category.findFirst({ where: { slug: 'dasturlash' } })).id;
});

describe('Kategoriyalar CRUD (admin)', () => {
  it('yaratish, o\'qish, yangilash, o\'chirish', async () => {
    const a = await asAdmin();
    const created = await a.post(`${API}/categories`).send({ name: 'Test kategoriya' });
    expect(created.status).toBe(201);
    const { id } = created.body.data;

    expect((await guest().get(`${API}/categories/${id}`)).body.data.name).toBe('Test kategoriya');
    expect((await a.post(`${API}/categories`).send({ name: 'test KATEGORIYA' })).status).toBe(409);

    const upd = await a.patch(`${API}/categories/${id}`).send({ name: 'Yangi nom' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.slug).toBe('yangi-nom');

    expect((await a.delete(`${API}/categories/${id}`)).status).toBe(204);
    expect((await guest().get(`${API}/categories/${id}`)).status).toBe(404);
  });

  it('kurslari bor kategoriyani o\'chirib bo\'lmaydi (409)', async () => {
    const a = await asAdmin();
    expect((await a.delete(`${API}/categories/${categoryId}`)).status).toBe(409);
  });

  it('noto\'g\'ri ID -> 400', async () => {
    expect((await guest().get(`${API}/categories/abc`)).status).toBe(400);
  });
});

describe('Kurslar katalogi', () => {
  it('mehmon faqat PUBLISHED kurslarni ko\'radi, sahifalash ishlaydi', async () => {
    const res = await guest().get(`${API}/courses?limit=3&page=1`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 3 });
    const all = await guest().get(`${API}/courses?limit=50`);
    expect(all.body.data.every((c) => c.status === 'PUBLISHED')).toBe(true);
    expect(all.body.data.some((c) => c.title.includes('qoralama'))).toBe(false);
  });

  it('qidiruv, kategoriya va daraja filtri', async () => {
    const s = await guest().get(`${API}/courses?search=python`);
    expect(s.body.data.length).toBeGreaterThan(0);
    expect(s.body.data.every((c) => /python/i.test(c.title + c.description))).toBe(true);
    const f = await guest().get(`${API}/courses?category=dizayn&level=BEGINNER`);
    expect(f.body.data.every((c) => c.category.slug === 'dizayn' && c.level === 'BEGINNER')).toBe(true);
    expect((await guest().get(`${API}/courses?level=XATO`)).status).toBe(422);
  });

  it('DRAFT kurs mehmonga 404, egasiga 200', async () => {
    const draft = await prisma.course.findFirst({ where: { status: 'DRAFT', teacher: { email: 'sardor@edulearn.uz' } } });
    expect((await guest().get(`${API}/courses/${draft.slug}`)).status).toBe(404);
    const t = await asTeacher();
    expect((await t.get(`${API}/courses/${draft.slug}`)).status).toBe(200);
  });
});

describe('Kurs CRUD va egalik (ownership)', () => {
  it('o\'qituvchi o\'z kursini yaratadi, yangilaydi, nashr qiladi, o\'chiradi', async () => {
    const t = await asTeacher();
    const c = await t.post(`${API}/courses`).send({ title: 'Test kursi', shortDescription: 'Qisqa test tavsifi', description: 'Bu test uchun kurs tavsifi', categoryId });
    expect(c.status).toBe(201);
    expect(c.body.data.status).toBe('DRAFT');
    expect(c.body.data.shortDescription).toBe('Qisqa test tavsifi');
    const { id } = c.body.data;

    const u = await t.patch(`${API}/courses/${id}`).send({ title: 'Test kursi 2' });
    expect(u.status).toBe(200);
    expect(u.body.data.slug).toBe('test-kursi-2');

    // Darssiz kursni nashr qilib bo'lmaydi
    expect((await t.patch(`${API}/courses/${id}`).send({ status: 'PUBLISHED' })).status).toBe(422);
    // O'qituvchi ARCHIVED (yashirish) holatini qo'ya olmaydi — bu faqat admin uchun
    expect((await t.patch(`${API}/courses/${id}`).send({ status: 'ARCHIVED' })).status).toBe(422);

    const lesson = await t.post(`${API}/courses/${id}/lessons`).send({ title: 'Birinchi dars', content: 'Matn' });
    const pub = await t.patch(`${API}/courses/${id}`).send({ status: 'PUBLISHED' });
    expect(pub.status).toBe(200);
    expect(pub.body.data.status).toBe('PUBLISHED');
    expect((await guest().get(`${API}/courses/${id}`)).status).toBe(200);

    // Oxirgi dars o'chirilsa kurs qoralamaga qaytadi
    await t.delete(`${API}/lessons/${lesson.body.data.id}`);
    expect((await guest().get(`${API}/courses/${id}`)).status).toBe(404);

    expect((await t.delete(`${API}/courses/${id}`)).status).toBe(204);
  });

  it('boshqa o\'qituvchining kursini o\'zgartira olmaydi (403)', async () => {
    const other = await asTeacher2();
    const course = await prisma.course.findFirst({ where: { teacher: { email: 'sardor@edulearn.uz' } } });
    expect((await other.patch(`${API}/courses/${course.id}`).send({ title: 'Buzildi' })).status).toBe(403);
    expect((await other.delete(`${API}/courses/${course.id}`)).status).toBe(403);
    expect((await other.post(`${API}/courses/${course.id}/lessons`).send({ title: 'Begona dars', content: 'x' })).status).toBe(403);
  });

  it('admin kursni yashiradi (ARCHIVED) — o\'qituvchi uni o\'zi qayta ocholmaydi', async () => {
    const a = await asAdmin();
    const t = await asTeacher();
    const course = await prisma.course.findFirst({ where: { slug: 'git-va-github' } });
    expect((await a.patch(`${API}/admin/courses/${course.id}/status`).send({ status: 'ARCHIVED' })).body.data.status).toBe('ARCHIVED');
    expect((await guest().get(`${API}/courses/${course.slug}`)).status).toBe(404);
    expect((await t.patch(`${API}/courses/${course.id}`).send({ status: 'PUBLISHED' })).status).toBe(403);
    expect((await a.patch(`${API}/admin/courses/${course.id}/status`).send({ status: 'PUBLISHED' })).body.data.status).toBe('PUBLISHED');
    expect((await guest().get(`${API}/courses/${course.slug}`)).status).toBe(200);
  });

  it('validatsiya: bo\'sh sarlavha, qisqa tavsif yo\'q, mavjud bo\'lmagan kategoriya -> 422', async () => {
    const t = await asTeacher();
    const base = { title: 'Kurs', shortDescription: 'Qisqa tavsif matni', description: 'Tavsif tavsif', categoryId };
    expect((await t.post(`${API}/courses`).send({ ...base, title: '  ' })).status).toBe(422);
    expect((await t.post(`${API}/courses`).send({ ...base, shortDescription: undefined })).status).toBe(422);
    expect((await t.post(`${API}/courses`).send({ ...base, categoryId: 99999 })).status).toBe(422);
  });
});

describe('Darslar', () => {
  it('yozilmagan foydalanuvchi dars matnini ko\'rmaydi (preview dan tashqari)', async () => {
    const course = await prisma.course.findFirst({ where: { slug: 'ui-ux-dizayn-asoslari' } });
    const res = await (await asStudent()).get(`${API}/courses/${course.id}/lessons`);
    expect(res.status).toBe(200);
    const [first, second] = res.body.data;
    expect(first.isPreview).toBe(true);
    expect(first.content).not.toBeNull();
    expect(second.locked).toBe(true);
    expect(second.content).toBeNull();
  });

  it('o\'qituvchi dars qo\'shadi, tartiblaydi, o\'chiradi', async () => {
    const t = await asTeacher();
    const course = await prisma.course.findFirst({ where: { slug: 'git-va-github' } });
    const add = await t.post(`${API}/courses/${course.id}/lessons`).send({ title: 'Yangi dars', content: 'Matn' });
    expect(add.status).toBe(201);
    const lessons = (await t.get(`${API}/courses/${course.id}/lessons`)).body.data.map((l) => l.id);
    const reversed = [...lessons].reverse();
    const ord = await t.put(`${API}/courses/${course.id}/lessons/order`).send({ lessonIds: reversed });
    expect(ord.body.data.map((l) => l.id)).toEqual(reversed);
    await t.put(`${API}/courses/${course.id}/lessons/order`).send({ lessonIds: lessons });
    expect((await t.delete(`${API}/lessons/${add.body.data.id}`)).status).toBe(204);
  });
});

describe('Yozilish va progress', () => {
  it('yozilish, takroriy yozilish 409, progress, kursdan chiqish', async () => {
    const s = await asStudent2();
    const course = await prisma.course.findFirst({ where: { slug: 'figma-noldan-professionalgacha' }, include: { lessons: true } });

    expect((await s.post(`${API}/courses/${course.id}/enroll`)).status).toBe(201);
    expect((await s.post(`${API}/courses/${course.id}/enroll`)).status).toBe(409);

    const lessonId = course.lessons[0].id;
    const p1 = await s.patch(`${API}/lessons/${lessonId}/progress`).send({ completed: true });
    const p2 = await s.patch(`${API}/lessons/${lessonId}/progress`).send({ completed: true });
    expect(p1.body.data.completed).toBe(1);
    expect(p2.body.data.completed).toBe(1); // takroriy yozuv yo'q
    expect(p2.body.data.percent).toBe(Math.round((1 / course.lessons.length) * 100));
    expect(await prisma.lessonProgress.count({ where: { lessonId } })).toBeGreaterThan(0);

    const prog = await s.get(`${API}/courses/${course.id}/progress`);
    expect(prog.body.data.completedLessonIds).toContain(lessonId);

    expect((await s.delete(`${API}/courses/${course.id}/enroll`)).status).toBe(204);
    expect((await s.get(`${API}/courses/${course.id}/progress`)).status).toBe(403);
  });

  it('nashr qilinmagan kursga yozilib bo\'lmaydi', async () => {
    const s = await asStudent();
    const draft = await prisma.course.findFirst({ where: { status: 'DRAFT' } });
    expect((await s.post(`${API}/courses/${draft.id}/enroll`)).status).toBe(404);
  });

  it('darsi yo\'q kursda progress 0%', async () => {
    const t = await asTeacher();
    const a = await asAdmin();
    const s = await asStudent2();
    const c = (await t.post(`${API}/courses`).send({ title: 'Bo\'sh kurs', shortDescription: 'Darsi yo\'q kurs', description: 'Darsi yo\'q kurs tavsifi', categoryId })).body.data;
    await a.patch(`${API}/admin/courses/${c.id}/status`).send({ status: 'PUBLISHED' });
    await s.post(`${API}/courses/${c.id}/enroll`);
    const p = await s.get(`${API}/courses/${c.id}/progress`);
    expect(p.body.data).toMatchObject({ total: 0, completed: 0, percent: 0 });
    await t.delete(`${API}/courses/${c.id}`);
  });

  it('yozilmagan kurs darsini tugatib bo\'lmaydi (403)', async () => {
    const s = await asStudent2();
    const course = await prisma.course.findFirst({ where: { slug: 'ma-lumotlar-bazasi-sql' }, include: { lessons: true } })
      || await prisma.course.findFirst({ where: { title: { contains: 'SQL' } }, include: { lessons: true } });
    expect((await s.patch(`${API}/lessons/${course.lessons[0].id}/progress`).send({ completed: true })).status).toBe(403);
  });

  it('o\'qituvchi faqat o\'z kursi talabalarini ko\'radi', async () => {
    const course = await prisma.course.findFirst({ where: { slug: 'web-dasturlash-frontend' } });
    const own = await (await asTeacher()).get(`${API}/teacher/courses/${course.id}/students`);
    expect(own.status).toBe(200);
    expect(own.body.data.length).toBeGreaterThan(0);
    expect(own.body.data[0].progress).toHaveProperty('percent');
    expect((await (await asTeacher2()).get(`${API}/teacher/courses/${course.id}/students`)).status).toBe(403);
  });
});

describe('Admin', () => {
  it('statistika haqiqiy sonlarni qaytaradi', async () => {
    const res = await (await asAdmin()).get(`${API}/admin/stats`);
    expect(res.status).toBe(200);
    expect(res.body.data.users.students).toBe(await prisma.user.count({ where: { role: 'STUDENT' } }));
    expect(res.body.data.enrollmentsByMonth).toHaveLength(6);
  });

  it('o\'qituvchi rolini berish va qaytarib olish', async () => {
    const a = await asAdmin();
    const u = await prisma.user.findUnique({ where: { email: 'jamshid@edulearn.uz' } });
    expect((await a.patch(`${API}/admin/users/${u.id}/role`).send({ role: 'TEACHER' })).body.data.role).toBe('TEACHER');
    expect((await a.patch(`${API}/admin/users/${u.id}/role`).send({ role: 'STUDENT' })).body.data.role).toBe('STUDENT');
  });

  it('noma\'lum endpoint -> 404', async () => {
    expect((await guest().get(`${API}/yoq-narsa`)).status).toBe(404);
  });
});
