// Autentifikatsiya va rollar testlari
const { API, guest, asStudent, asTeacher, asAdmin, request, app } = require('./helpers');
const prisma = require('../src/lib/prisma');

const unique = () => `test${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
const valid = (email) => ({ firstName: 'Test', lastName: 'Talaba', email, password: 'Parol12345', confirmPassword: 'Parol12345' });

describe('Ro\'yxatdan o\'tish', () => {
  it('yangi talaba yaratadi, 201 va cookie qaytaradi, parol hash qilingan', async () => {
    const email = unique();
    const res = await guest().post(`${API}/auth/register`).send(valid(email));
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);

    const db = await prisma.user.findUnique({ where: { email } });
    expect(db.passwordHash).not.toBe('Parol12345');
    expect(db.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt formati
  });

  it('rol yuborilsa ham faqat STUDENT bo\'ladi (admin/o\'qituvchi bo\'lib bo\'lmaydi)', async () => {
    for (const role of ['SUPER_ADMIN', 'TEACHER']) {
      const res = await guest().post(`${API}/auth/register`).send({ ...valid(unique()), role });
      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('STUDENT');
    }
  });

  it('band email -> 409', async () => {
    const res = await guest().post(`${API}/auth/register`).send(valid('talaba@edulearn.uz'));
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('noto\'g\'ri ma\'lumot -> 422 va maydonlar bo\'yicha xatolar', async () => {
    const res = await guest().post(`${API}/auth/register`).send({ firstName: 'A', email: 'xato', password: '123', confirmPassword: '321' });
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['firstName', 'lastName', 'email', 'password']));
  });

  it('parollar mos kelmasa -> 422', async () => {
    const res = await guest().post(`${API}/auth/register`).send({ ...valid(unique()), confirmPassword: 'Boshqa12345' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('confirmPassword');
  });

  it('buzilgan JSON -> 400', async () => {
    const res = await guest().post(`${API}/auth/register`).set('Content-Type', 'application/json').send('{"a":');
    expect(res.status).toBe(400);
  });
});

describe('Kirish', () => {
  it('to\'g\'ri parol -> 200, rol bazadan qaytadi', async () => {
    const res = await guest().post(`${API}/auth/login`).send({ email: 'sardor@edulearn.uz', password: process.env.SEED_DEMO_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('TEACHER');
  });

  it('noto\'g\'ri parol va mavjud bo\'lmagan email — bir xil umumiy xabar, 401', async () => {
    const a = await guest().post(`${API}/auth/login`).send({ email: 'talaba@edulearn.uz', password: 'xato12345' });
    const b = await guest().post(`${API}/auth/login`).send({ email: 'yoq@edulearn.uz', password: 'xato12345' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.message).toBe(b.body.message);
  });

  it('/auth/me — cookie bo\'lmasa 401, bo\'lsa foydalanuvchi', async () => {
    expect((await guest().get(`${API}/auth/me`)).status).toBe(401);
    const agent = await asStudent();
    const me = await agent.get(`${API}/auth/me`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('talaba@edulearn.uz');
  });

  it('logout cookie\'ni o\'chiradi', async () => {
    const agent = await asStudent();
    expect((await agent.post(`${API}/auth/logout`)).status).toBe(204);
    expect((await agent.get(`${API}/auth/me`)).status).toBe(401);
  });

  it('bloklangan foydalanuvchi kira olmaydi (403)', async () => {
    const email = unique();
    await request(app).post(`${API}/auth/register`).send(valid(email));
    await prisma.user.update({ where: { email }, data: { isActive: false } });
    const res = await guest().post(`${API}/auth/login`).send({ email, password: 'Parol12345' });
    expect(res.status).toBe(403);
  });
});

describe('RBAC — rolga qarab ruxsat', () => {
  it('talaba admin va o\'qituvchi endpointlariga kira olmaydi (403)', async () => {
    const s = await asStudent();
    expect((await s.get(`${API}/admin/stats`)).status).toBe(403);
    expect((await s.get(`${API}/admin/users`)).status).toBe(403);
    expect((await s.post(`${API}/courses`).send({ title: 'Xakerlik', description: 'Talaba kurs yaratmoqchi', categoryId: 1 })).status).toBe(403);
    expect((await s.post(`${API}/categories`).send({ name: 'Yangi' })).status).toBe(403);
    expect((await s.get(`${API}/teacher/courses`)).status).toBe(403);
  });

  it('o\'qituvchi admin endpointlariga kira olmaydi (403)', async () => {
    const t = await asTeacher();
    expect((await t.get(`${API}/admin/users`)).status).toBe(403);
    expect((await t.patch(`${API}/admin/users/2/role`).send({ role: 'TEACHER' })).status).toBe(403);
  });

  it('mehmon himoyalangan endpointga -> 401', async () => {
    expect((await guest().get(`${API}/students/me/enrollments`)).status).toBe(401);
    expect((await guest().post(`${API}/courses/1/enroll`)).status).toBe(401);
  });

  it('admin SUPER_ADMIN rolini bera olmaydi va o\'zini o\'zgartira olmaydi', async () => {
    const a = await asAdmin();
    const me = (await a.get(`${API}/auth/me`)).body.data.user;
    expect((await a.patch(`${API}/admin/users/${me.id}/status`).send({ isActive: false })).status).toBe(400);
    const student = await prisma.user.findUnique({ where: { email: 'jamshid@edulearn.uz' } });
    expect((await a.patch(`${API}/admin/users/${student.id}/role`).send({ role: 'SUPER_ADMIN' })).status).toBe(422);
  });
});
