// Testlar uchun yordamchilar: har bir rol bilan tizimga kirgan "agent" (cookie saqlaydi).
const request = require('supertest');
const app = require('../src/app');

const API = '/api/v1';
const DEMO = process.env.SEED_DEMO_PASSWORD;
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL || 'admin@edulearn.uz', password: process.env.SEED_ADMIN_PASSWORD };

async function loginAs(email, password = DEMO) {
  const agent = request.agent(app);
  const res = await agent.post(`${API}/auth/login`).send({ email, password });
  if (res.status !== 200) throw new Error(`Login xato: ${email} ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

const asStudent = () => loginAs('talaba@edulearn.uz');
const asStudent2 = () => loginAs('sevara@edulearn.uz');
const asTeacher = () => loginAs('sardor@edulearn.uz');
const asTeacher2 = () => loginAs('dilnoza@edulearn.uz');
const asAdmin = () => loginAs(ADMIN.email, ADMIN.password);
const guest = () => request(app);

module.exports = { API, app, request, loginAs, asStudent, asStudent2, asTeacher, asTeacher2, asAdmin, guest };
