// Talaba / o'qituvchi / admin panellari qolipi: chapda sidebar (telefonda yuqorida suriladigan qator).
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import {
  ArrowLeft, BarChart3, BookOpen, FolderTree, GraduationCap, Home, Layers, LayoutDashboard,
  LogOut, Mail, PlusCircle, UserRound, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { Avatar } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, cn } from '../utils/format';

export const MENUS = {
  STUDENT: [
    ['/student/dashboard', LayoutDashboard, 'Bosh sahifa'],
    ['/student/courses', BookOpen, 'Barcha kurslar'],
    ['/student/my-courses', Layers, 'Mening kurslarim'],
    ['/student/profile', UserRound, 'Profil'],
  ],
  TEACHER: [
    ['/teacher/dashboard', LayoutDashboard, 'Bosh sahifa'],
    ['/teacher/courses', BookOpen, 'Mening kurslarim'],
    ['/teacher/courses/new', PlusCircle, 'Yangi kurs'],
    ['/teacher/profile', UserRound, 'Profil'],
  ],
  SUPER_ADMIN: [
    ['/admin/dashboard', BarChart3, 'Statistika'],
    ['/admin/users', Users, 'Foydalanuvchilar'],
    ['/admin/courses', GraduationCap, 'Kurslar'],
    ['/admin/categories', FolderTree, 'Kategoriyalar'],
    ['/admin/messages', Mail, 'Xabarlar'],
    ['/admin/profile', UserRound, 'Profil'],
  ],
};

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
    isActive ? 'bg-brand-600 text-white shadow-[0_6px_16px_rgb(91_53_230/0.28)]' : 'text-ink/80 hover:bg-brand-50 hover:text-brand-700',
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
          <Link to="/" className="btn btn-ghost btn-sm lg:hidden"><Home /> Sayt</Link>
          <button type="button" onClick={onLogout} className="btn btn-ghost btn-sm text-red-600 lg:hidden"><LogOut /> Chiqish</button>
          <div className="flex items-center gap-2.5">
            <Avatar user={user} />
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-xs font-semibold text-brand-600">{ROLES[user.role]}</p>
            </div>
          </div>
        </header>
        <main id="main" className="px-4 pb-12 pt-4 sm:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
