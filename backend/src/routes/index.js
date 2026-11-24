// Barcha API marshrutlari: /api/v1/...
// Har bir qatorda: METOD, MANZIL, kim kira oladi (middleware), validatsiya, controller.
//   authenticate         — kirish majburiy (401)
//   requireRole(...)     — faqat shu rollar (403)
//   optionalAuth         — mehmon ham kira oladi, kirgan bo'lsa req.user bor
//   validate({...})      — kiruvchi ma'lumot tekshiruvi (400/422)
const { Router } = require('express');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter, contactLimiter } = require('../middleware/rateLimit');
const { idParam } = require('../validators/common');
const s = require('../validators/schemas');

const auth = require('../controllers/auth.controller');
const users = require('../controllers/users.controller');
const categories = require('../controllers/categories.controller');
const courses = require('../controllers/courses.controller');
const lessons = require('../controllers/lessons.controller');
const enrollments = require('../controllers/enrollments.controller');
const admin = require('../controllers/admin.controller');
const pub = require('../controllers/public.controller');
const teacherRequests = require('../controllers/teacherRequests.controller');

const STUDENT = 'STUDENT';
const TEACHER = 'TEACHER';
const ADMIN = 'SUPER_ADMIN';

const r = Router();

// ---------- AUTH ----------
r.post('/auth/register', authLimiter, validate({ body: s.register }), auth.register);
r.post('/auth/login', authLimiter, validate({ body: s.login }), auth.login);
r.post('/auth/logout', auth.logout);
r.get('/auth/me', authenticate, auth.me);

// ---------- PROFIL ----------
r.get('/users/me', authenticate, users.getMe);
r.patch('/users/me', authenticate, validate({ body: s.updateMe }), users.updateMe);
r.patch('/users/me/password', authenticate, validate({ body: s.changePassword }), users.changePassword);

// ---------- KATEGORIYALAR (to'liq CRUD) ----------
r.get('/categories', categories.list);
r.get('/categories/:id', validate({ params: idParam }), categories.getOne);
r.post('/categories', authenticate, requireRole(ADMIN), validate({ body: s.category }), categories.create);
r.patch('/categories/:id', authenticate, requireRole(ADMIN), validate({ params: idParam, body: s.category }), categories.update);
r.delete('/categories/:id', authenticate, requireRole(ADMIN), validate({ params: idParam }), categories.remove);

// ---------- KURSLAR (to'liq CRUD) ----------
r.get('/courses', optionalAuth, validate({ query: s.courseQuery }), courses.list);
r.get('/courses/:idOrSlug', optionalAuth, validate({ params: s.courseIdOrSlug }), courses.getOne);
r.post('/courses', authenticate, requireRole(TEACHER), validate({ body: s.courseCreate }), courses.create);
r.patch('/courses/:id', authenticate, requireRole(TEACHER, ADMIN), validate({ params: idParam, body: s.courseUpdate }), courses.update);
r.delete('/courses/:id', authenticate, requireRole(TEACHER, ADMIN), validate({ params: idParam }), courses.remove);

// ---------- DARSLAR ----------
r.get('/courses/:courseId/lessons', optionalAuth, validate({ params: s.courseIdParam }), lessons.listByCourse);
r.post('/courses/:courseId/lessons', authenticate, requireRole(TEACHER, ADMIN), validate({ params: s.courseIdParam, body: s.lessonCreate }), lessons.create);
r.put('/courses/:courseId/lessons/order', authenticate, requireRole(TEACHER, ADMIN), validate({ params: s.courseIdParam, body: s.lessonOrder }), lessons.reorder);
r.patch('/lessons/:lessonId', authenticate, requireRole(TEACHER, ADMIN), validate({ params: s.lessonIdParam, body: s.lessonUpdate }), lessons.update);
r.delete('/lessons/:lessonId', authenticate, requireRole(TEACHER, ADMIN), validate({ params: s.lessonIdParam }), lessons.remove);

// ---------- YOZILISH VA PROGRESS (talaba) ----------
r.post('/courses/:courseId/enroll', authenticate, requireRole(STUDENT), validate({ params: s.courseIdParam }), enrollments.enroll);
r.delete('/courses/:courseId/enroll', authenticate, requireRole(STUDENT), validate({ params: s.courseIdParam }), enrollments.unenroll);
r.get('/students/me/enrollments', authenticate, requireRole(STUDENT), enrollments.myEnrollments);
r.get('/courses/:courseId/progress', authenticate, requireRole(STUDENT), validate({ params: s.courseIdParam }), enrollments.courseProgress);
r.patch('/lessons/:lessonId/progress', authenticate, requireRole(STUDENT), validate({ params: s.lessonIdParam, body: s.progress }), enrollments.setLessonProgress);

// ---------- O'QITUVCHI ----------
r.get('/teacher/courses', authenticate, requireRole(TEACHER), courses.teacherCourses);
r.get('/teacher/students', authenticate, requireRole(TEACHER), enrollments.teacherStudents);
r.get('/teacher/courses/:courseId/students', authenticate, requireRole(TEACHER, ADMIN), validate({ params: s.courseIdParam }), enrollments.courseStudents);

// ---------- O'QITUVCHI BO'LISH ARIZASI (talaba) ----------
r.post('/teacher-requests', authenticate, requireRole(STUDENT), validate({ body: s.teacherRequest }), teacherRequests.create);
r.get('/teacher-requests/my', authenticate, requireRole(STUDENT), teacherRequests.mine);

// ---------- SUPER ADMIN ----------
r.use('/admin', authenticate, requireRole(ADMIN));
r.get('/admin/teacher-requests', validate({ query: s.requestQuery }), teacherRequests.list);
r.patch('/admin/teacher-requests/:id', validate({ params: idParam, body: s.requestDecision }), teacherRequests.decide);
r.get('/admin/stats', admin.stats);
r.get('/admin/users', validate({ query: s.userQuery }), admin.users);
r.patch('/admin/users/:id/role', validate({ params: idParam, body: s.roleUpdate }), admin.setRole);
r.patch('/admin/users/:id/status', validate({ params: idParam, body: s.statusUpdate }), admin.setStatus);
r.get('/admin/courses', validate({ query: s.adminCourseQuery }), admin.courses);
r.patch('/admin/courses/:id/status', validate({ params: idParam, body: s.courseStatus }), admin.setCourseStatus);
r.get('/admin/messages', validate({ query: s.pageQuery }), admin.messages);
r.patch('/admin/messages/:id/read', validate({ params: idParam }), admin.markMessageRead);

// ---------- OCHIQ ----------
r.get('/teachers', pub.teachers);
r.get('/teachers/:id', validate({ params: idParam }), pub.teacher);
r.get('/stats', pub.stats);
r.post('/contact', contactLimiter, validate({ body: s.contact }), pub.contact);

module.exports = r;
