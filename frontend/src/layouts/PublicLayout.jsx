// Ommaviy sahifalar qolipi: header (telefonda ☰ menyu), sahifa, footer.
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Mail, MapPin, Menu, UserPlus, UserRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { Avatar } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, cn } from '../utils/format';

const LINKS = [
  ['/', 'Bosh sahifa'],
  ['/courses', 'Kurslar'],
  ['/teachers', 'O\'qituvchilar'],
  ['/about', 'Biz haqimizda'],
  ['/contact', 'Bog\'lanish'],
];

const PROFILE_BY_ROLE = { STUDENT: '/student/profile', TEACHER: '/teacher/profile', SUPER_ADMIN: '/admin/profile' };

function UserMenu() {
  const { user, logout, homePath } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const onLogout = async () => {
    await logout();
    toast.success('Tizimdan chiqdingiz');
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2.5 rounded-full p-1 pr-2 hover:bg-white"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar user={user} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">{user.firstName} {user.lastName}</span>
          <span className="text-xs font-semibold text-brand-600">{ROLES[user.role]}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted sm:block" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 top-[calc(100%+8px)] z-50 w-56 p-1.5 shadow-pop">
          <Link role="menuitem" to={homePath} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700" onClick={() => setOpen(false)}>
            <LayoutDashboard className="size-4" /> Mening panelim
          </Link>
          <Link role="menuitem" to={PROFILE_BY_ROLE[user.role]} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700" onClick={() => setOpen(false)}>
            <UserRound className="size-4" /> Profil
          </Link>
          <button role="menuitem" type="button" onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
            <LogOut className="size-4" /> Chiqish
          </button>
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const linkCls = ({ isActive }) => cn(
    'rounded-xl px-3.5 py-2 text-[15px] font-medium transition',
    isActive ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink/80 hover:text-brand-700',
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-page flex h-[72px] items-center gap-4">
        <Logo />
        <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Asosiy menyu">
          {LINKS.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={linkCls}>{label}</NavLink>)}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {user ? <UserMenu /> : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn btn-outline"><LogIn /> Kirish</Link>
              <Link to="/register" className="btn btn-primary"><UserPlus /> Ro'yxatdan o'tish</Link>
            </div>
          )}
          <button
            type="button"
            className="btn btn-outline btn-icon lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Menyuni yopish' : 'Menyuni ochish'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" className="border-t border-line bg-white px-4 pb-4 pt-2 shadow-lg lg:hidden" aria-label="Mobil menyu">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('block rounded-xl px-4 py-3 font-medium', isActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-canvas')}>
              {label}
            </NavLink>
          ))}
          {!user && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
              <Link to="/login" className="btn btn-outline"><LogIn /> Kirish</Link>
              <Link to="/register" className="btn btn-primary"><UserPlus /> Ro'yxatdan o'tish</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="container-page grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">Bilim oling, ko'nikmalaringizni rivojlantiring va orzuingizdagi kasbga yaqinlashing.</p>
        </div>
        <div>
          <h2 className="mb-3 font-semibold">Sahifalar</h2>
          <ul className="space-y-2 text-sm text-muted">
            {LINKS.map(([to, label]) => <li key={to}><Link to={to} className="hover:text-brand-700">{label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-semibold">Aloqa</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><Mail className="size-4 text-brand-600" aria-hidden="true" /> info@edulearn.uz</li>
            <li className="flex items-center gap-2"><MapPin className="size-4 text-brand-600" aria-hidden="true" /> Toshkent, O'zbekiston</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-sm text-muted">© {new Date().getFullYear()} EduLearn. Web texnologiyalar fani yakuniy loyihasi.</div>
    </footer>
  );
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Asosiy mazmunga o'tish
      </a>
      <Navbar />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
