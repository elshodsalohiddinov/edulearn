// O'qituvchi bo'lish arizasi va o'qituvchining umumiy talabalar ro'yxati testlari
const { API, request, app, asTeacher, asTeacher2, asAdmin, loginAs } = require('./helpers');
const prisma = require('../src/lib/prisma');

const valid = { expertise: 'Frontend dasturlash', experience: 'Ikki yildan beri React bilan loyihalar qilaman va kurslarda yordam beraman.' };

async function newStudent() {
  const email = `ariza${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
  await request(app).post(`${API}/auth/register`).send({ firstName: 'Ariza', lastName: 'Beruvchi', email, password: 'Parol12345', confirmPassword: 'Parol12345' });
  return { email, agent: await loginAs(email, 'Parol12345') };
}

describe('O\'qituvchi bo\'lish arizasi', () => {
  it('talaba ariza yuboradi, takroriy ariza 409, admin qabul qilsa rol TEACHER bo\'ladi', async () => {
    const { email, agent } = await newStudent();
    const r = await agent.post(`${API}/teacher-requests`).send(valid);
    expect(r.status).toBe(201);
    expect(r.body.data.status).toBe('PENDING');
    expect((await agent.post(`${API}/teacher-requests`).send(valid)).status).toBe(409);
    expect((await agent.get(`${API}/teacher-requests/my`)).body.data).toHaveLength(1);

    const a = await asAdmin();
    const list = await a.get(`${API}/admin/teacher-requests?status=PENDING`);
    expect(list.body.data.some((x) => x.id === r.body.data.id)).toBe(true);

    const ok = await a.patch(`${API}/admin/teacher-requests/${r.body.data.id}`).send({ status: 'APPROVED' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('APPROVED');
    expect((await prisma.user.findUnique({ where: { email } })).role).toBe('TEACHER');

    // Ikki marta tasdiqlab bo'lmaydi
    expect((await a.patch(`${API}/admin/teacher-requests/${r.body.data.id}`).send({ status: 'REJECTED' })).status).toBe(409);
    // Endi u o'qituvchi: ariza endpointi unga yopiq (403)
    const asNewTeacher = await loginAs(email, 'Parol12345');
    expect((await asNewTeacher.post(`${API}/teacher-requests`).send(valid)).status).toBe(403);
  });

  it('rad etilsa rol STUDENT bo\'lib qoladi va qayta ariza berish mumkin', async () => {
    const { email, agent } = await newStudent();
    const r = await agent.post(`${API}/teacher-requests`).send(valid);
    const a = await asAdmin();
    expect((await a.patch(`${API}/admin/teacher-requests/${r.body.data.id}`).send({ status: 'REJECTED' })).body.data.status).toBe('REJECTED');
    expect((await prisma.user.findUnique({ where: { email } })).role).toBe('STUDENT');
    expect((await agent.post(`${API}/teacher-requests`).send(valid)).status).toBe(201);
  });

  it('validatsiya va ruxsatlar', async () => {
    const { agent } = await newStudent();
    expect((await agent.post(`${API}/teacher-requests`).send({ expertise: 'a', experience: 'qisqa' })).status).toBe(422);
    expect((await agent.get(`${API}/admin/teacher-requests`)).status).toBe(403);
    expect((await (await asTeacher()).post(`${API}/teacher-requests`).send(valid)).status).toBe(403);
    expect((await request(app).post(`${API}/teacher-requests`).send(valid)).status).toBe(401);
  });
});

describe('O\'qituvchining barcha talabalari', () => {
  it('faqat o\'z kurslaridagi talabalarni ko\'radi', async () => {
    const t = await asTeacher();
    const res = await t.get(`${API}/teacher/students`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const own = await prisma.course.findMany({ where: { teacher: { email: 'sardor@edulearn.uz' } }, select: { id: true } });
    const ownIds = new Set(own.map((c) => c.id));
    expect(res.body.data.every((r) => ownIds.has(r.course.id))).toBe(true);
    expect(res.body.data[0].progress).toHaveProperty('percent');
    expect((await (await asTeacher2()).get(`${API}/teacher/students`)).body.data.every((r) => !ownIds.has(r.course.id))).toBe(true);
  });
});
