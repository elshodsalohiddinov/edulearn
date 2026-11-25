// Backend bilan ishlash uchun yagona axios mijoz.
// withCredentials: true — HttpOnly cookie (JWT) har bir so'rov bilan avtomatik yuboriladi.
// Token JavaScript'da umuman saqlanmaydi (localStorage ishlatilmaydi) — XSS dan himoya.
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Backend xatosini bir xil ko'rinishga keltiramiz: { status, message, errors }
export class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      return Promise.reject(new ApiError(0, 'Server bilan aloqa yo\'q. Internetni tekshiring.'));
    }
    const { status, data } = err.response;
    return Promise.reject(new ApiError(status, data?.message || 'Xatolik yuz berdi', data?.errors || []));
  },
);

// { success, data, meta } -> { data, meta }
export const unwrap = (res) => ({ data: res.data?.data, meta: res.data?.meta });
export const dataOf = (res) => res.data?.data;
