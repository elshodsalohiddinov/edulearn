// Matnlar va formatlash yordamchilari (UI o'zbek tilida)
import { BookOpen, Briefcase, Code2, Languages, Megaphone, Palette } from 'lucide-react';

export const LEVELS = { BEGINNER: 'Boshlang\'ich', INTERMEDIATE: 'O\'rta', ADVANCED: 'Yuqori' };
export const ROLES = { STUDENT: 'Talaba', TEACHER: 'O\'qituvchi', SUPER_ADMIN: 'Super admin' };
export const STATUSES = {
  DRAFT: { label: 'Qoralama', cls: 'bg-slate-100 text-slate-600' },
  PENDING: { label: 'Kutilmoqda', cls: 'bg-amber-50 text-amber-700' },
  PUBLISHED: { label: 'Nashr qilingan', cls: 'bg-emerald-50 text-emerald-700' },
  ARCHIVED: { label: 'Yashirilgan', cls: 'bg-red-50 text-red-600' },
};

export const fullName = (u) => (u ? `${u.firstName} ${u.lastName}` : '');
export const initials = (u) => (u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() : '?');

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function minutesLabel(min) {
  if (!min) return '0 daqiqa';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} soat${m ? ` ${m} daqiqa` : ''}` : `${m} daqiqa`;
}

// Kategoriya slug -> ikon va rang (rasm yo'q kurslar uchun chiroyli muqova)
const CATEGORY_STYLE = {
  dasturlash: { icon: Code2, gradient: 'from-indigo-950 via-violet-800 to-violet-500', tint: 'text-brand-600' },
  dizayn: { icon: Palette, gradient: 'from-indigo-900 via-violet-600 to-pink-500', tint: 'text-fuchsia-600' },
  marketing: { icon: Megaphone, gradient: 'from-purple-950 via-violet-700 to-violet-400', tint: 'text-rose-500' },
  'ingliz-tili': { icon: Languages, gradient: 'from-sky-900 via-indigo-700 to-indigo-400', tint: 'text-blue-600' },
  biznes: { icon: Briefcase, gradient: 'from-indigo-950 via-violet-800 to-pink-400', tint: 'text-amber-600' },
};
export const categoryStyle = (slug) =>
  CATEGORY_STYLE[slug] || { icon: BookOpen, gradient: 'from-indigo-950 via-brand-700 to-brand-400', tint: 'text-brand-600' };

// YouTube/Vimeo havolasini xavfsiz "embed" manziliga aylantiradi. Boshqa saytlar iframe'da ochilmaydi.
export function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtube.com' && u.searchParams.get('v')) return `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}`;
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === 'youtube.com' && u.pathname.startsWith('/embed/')) return `https://www.youtube-nocookie.com${u.pathname}`;
    if (host === 'vimeo.com' && /^\/\d+/.test(u.pathname)) return `https://player.vimeo.com/video${u.pathname}`;
  } catch {
    return null;
  }
  return null;
}

export const cn = (...classes) => classes.filter(Boolean).join(' ');
