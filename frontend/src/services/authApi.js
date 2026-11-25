import { api, dataOf } from './api';

export const authApi = {
  register: (body) => api.post('/auth/register', body).then(dataOf),
  login: (body) => api.post('/auth/login', body).then(dataOf),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me').then(dataOf),
};

export const usersApi = {
  me: () => api.get('/users/me').then(dataOf),
  update: (body) => api.patch('/users/me', body).then(dataOf),
  changePassword: (body) => api.patch('/users/me/password', body),
};
