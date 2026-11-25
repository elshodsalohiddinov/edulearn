// Talaba / o'qituvchi / admin panellari qolipi: chapda sidebar (telefonda yuqorida suriladigan qator).
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import {
  ArrowLeft, BarChart3, BookOpen, ChevronDown, FolderTree, GraduationCap, Home, Layers, LayoutDashboard,
  LogOut, Mail, PlusCircle, UserCheck, UserRound, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { Avatar } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, cn } from '../utils/format';

// Har bir rolning menyusi. Faqat ishlaydigan sahifalar — bo'sh "keyinroq" bo'limlar yo'q.
export const MENUS = {
  STUDENT: [
    ['/student/dashboard', LayoutDashboard, 'Bosh sahifa'],
    ['/student/courses', BookOpen, 'Kurslar'],
    ['/student/my-courses', Layers, 'Mening kurslarim'],
    ['/student/progress', BarChart3, 'Progress'],
    ['/student/profile', UserRound, 'Profil'],
  ],
  TEACHER: [
    ['/teacher/dashboard', LayoutDashboard, 'Dashboard'],
    ['/teacher/courses', BookOpen, 'Mening kurslarim'],
    ['/teacher/courses/new', PlusCircle, 'Yangi kurs'],
    ['/teacher/students', Users, 'Talabalar'],
    ['/teacher/profile', UserRound, 'Profil'],
  ],
  SUPER_ADMIN: [
    ['/admin/dashboard', LayoutDashboard, 'Umumiy ko\'rinish'],
    ['/admin/users', Users, 'Foydalanuvchilar'],
    ['/admin/teacher-requests', UserCheck, 'O\'qituvchi so\'rovlari'],
    ['/admin/courses', GraduationCap, 'Barcha kurslar'],
    ['/admin/categories', FolderTree, 'Kategoriyalar'],
    ['/admin/stats', BarChart3, 'Statistika'],
    ['/admin/messages', Mail, 'Xabarlar'],
    ['/admin/profile', UserRound, 'Profil'],
  ],
};

const PROFILE = { STUDENT: '/student/profile', TEACHER: '/teacher/profile', SUPER_ADMIN: '/admin/profile' };

// Yuqori paneldagi foydalanuvchi menyusi: ism, rol badge, Profil va Chiqish
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="flex items-center gap-2.5 rounded-full p-1 pr-2 hover:bg-white" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <Avatar user={user} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">{user.firstName} {user.lastName}</span>
          <span className="badge mt-0.5 bg-brand-50 px-2 py-0 text-[11px] text-brand-700">{ROLES[user.role]}</span>
        </span>
        <ChevronDown className="size-4 text-muted" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 top-[calc(100%+8px)] z-50 w-52 p-1.5 shadow-pop">
          <Link role="menuitem" to={PROFILE[user.role]} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700">
            <UserRound className="size-4" /> Profil
          </Link>
          <Link role="menuitem" to="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700">
            <Home className="size-4" /> Saytga qaytish
          </Link>
          <button role="menuitem" type="button" onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
            <LogOut className="size-4" /> Chiqish
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = MENUS[user.role];

  const onLogout = async () => {
    await logout();
    toast.success('Tizimdan chiqdingiz');
    navigate('/');
  };

  const linkCls = ({ isActive }) => cn(
    'flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 font-medium transition lg:py-3',
    isActive ? 'bg-brand-600 text-white shadow-[0_6px_16px_rgb(98_54_245/0.28)]' : 'text-ink/80 hover:bg-brand-50 hover:text-brand-700',
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-white lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col lg:p-4">
          <div className="hidden px-2 pb-6 pt-1 lg:block"><Logo /></div>
          <nav className="flex gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:p-0" aria-label="Panel menyusi">
            {menu.map(([to, Icon, label]) => (
              <NavLink key={to} to={to} end className={linkCls}>
                <Icon className="size-5" aria-hidden="true" /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto hidden space-y-1 border-t border-line pt-4 lg:block">
            <Link to="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-medium text-ink/80 hover:bg-brand-50 hover:text-brand-700">
              <ArrowLeft className="size-5" aria-hidden="true" /> Saytga qaytish
            </Link>
            <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-medium text-red-600 hover:bg-red-50">
              <LogOut className="size-5" aria-hidden="true" /> Chiqish
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-end gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
          <UserMenu user={user} onLogout={onLogout} />
        </header>
        <main id="main" className="px-4 pb-12 pt-4 sm:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
