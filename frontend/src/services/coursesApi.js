import { api, dataOf, unwrap } from './api';

export const coursesApi = {
  list: (params) => api.get('/courses', { params }).then(unwrap),
  get: (idOrSlug) => api.get(`/courses/${idOrSlug}`).then(dataOf),
  create: (body) => api.post('/courses', body).then(dataOf),
  update: (id, body) => api.patch(`/courses/${id}`, body).then(dataOf),
  remove: (id) => api.delete(`/courses/${id}`),
};

export const categoriesApi = {
  list: () => api.get('/categories').then(dataOf),
  create: (body) => api.post('/categories', body).then(dataOf),
  update: (id, body) => api.patch(`/categories/${id}`, body).then(dataOf),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const lessonsApi = {
  list: (courseId) => api.get(`/courses/${courseId}/lessons`).then(unwrap),
  create: (courseId, body) => api.post(`/courses/${courseId}/lessons`, body).then(dataOf),
  update: (id, body) => api.patch(`/lessons/${id}`, body).then(dataOf),
  remove: (id) => api.delete(`/lessons/${id}`),
  reorder: (courseId, lessonIds) => api.put(`/courses/${courseId}/lessons/order`, { lessonIds }).then(dataOf),
};

export const enrollmentApi = {
  enroll: (courseId) => api.post(`/courses/${courseId}/enroll`).then(dataOf),
  unenroll: (courseId) => api.delete(`/courses/${courseId}/enroll`),
  mine: () => api.get('/students/me/enrollments').then(unwrap),
  progress: (courseId) => api.get(`/courses/${courseId}/progress`).then(dataOf),
  setLesson: (lessonId, completed) => api.patch(`/lessons/${lessonId}/progress`, { completed }).then(dataOf),
};

export const teacherApi = {
  courses: () => api.get('/teacher/courses').then(dataOf),
  students: (courseId) => api.get(`/teacher/courses/${courseId}/students`).then(dataOf),
};

export const publicApi = {
  teachers: () => api.get('/teachers').then(dataOf),
  teacher: (id) => api.get(`/teachers/${id}`).then(dataOf),
  stats: () => api.get('/stats').then(dataOf),
  contact: (body) => api.post('/contact', body).then(dataOf),
};

export const adminApi = {
  stats: () => api.get('/admin/stats').then(dataOf),
  users: (params) => api.get('/admin/users', { params }).then(unwrap),
  setRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then(dataOf),
  setStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }).then(dataOf),
  courses: (params) => api.get('/admin/courses', { params }).then(unwrap),
  setCourseStatus: (id, status) => api.patch(`/admin/courses/${id}/status`, { status }).then(dataOf),
  messages: (params) => api.get('/admin/messages', { params }).then(unwrap),
  markRead: (id) => api.patch(`/admin/messages/${id}/read`).then(dataOf),
};
