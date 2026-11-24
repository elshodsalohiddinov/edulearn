// Kirish, ro'yxatdan o'tish va parolni tiklash sahifalari.
// Rol tanlash YO'Q: login'dan keyin server bazadagi rolni qaytaradi va shunga qarab panel ochiladi.
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { BarChart3, BookOpen, KeyRound, LogIn, MonitorPlay, UserPlus } from 'lucide-react';
import Logo from '../../components/Logo';
import { PasswordField, TextField, applyServerErrors } from '../../components/FormField';
import { HOME_BY_ROLE, useAuth } from '../../contexts/AuthContext';
import { useTitle } from '../../hooks/useFetch';

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 p-12 text-white lg:flex">
        <div className="absolute -bottom-40 -right-40 size-[520px] rounded-full bg-white/10" aria-hidden="true" />
        <Logo light />
        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">Bilim oling, ko'nikma rivojlantiring, karyerangizni birga quring!</h2>
          <ul className="mt-8 space-y-4">
            {[[BookOpen, 'Turli yo\'nalishlarda bepul kurslar'], [BarChart3, 'Har bir dars bo\'yicha progress kuzatuvi'], [MonitorPlay, 'Istalgan qurilmada o\'qish']].map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-white/15"><Icon className="size-5" /></span>{t}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/70">© {new Date().getFullYear()} EduLearn</p>
      </aside>
      <main className="flex flex-col bg-white px-5 py-8 sm:px-10">
        <div className="lg:hidden"><Logo /></div>
        <div className="m-auto w-full max-w-md py-10">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mb-7 mt-2 text-muted">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}

// Login'dan keyin qayerga borish: avval so'ralgan sahifa (agar shu rolga tegishli bo'lsa), aks holda rol paneli
function targetAfterLogin(user, from) {
  const home = HOME_BY_ROLE[user.role];
  if (!from || from === '/login' || from === '/register') return home;
  const area = from.split('/')[1];
  const roleArea = { student: 'STUDENT', teacher: 'TEACHER', admin: 'SUPER_ADMIN' }[area];
  if (roleArea && roleArea !== user.role) return home;
  return from;
}

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email kiriting').email('Email noto\'g\'ri formatda'),
  password: z.string().min(1, 'Parolni kiriting'),
});

export function Login() {
  useTitle('Kirish');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success(`Xush kelibsiz, ${user.firstName}!`);
      navigate(targetAfterLogin(user, location.state?.from), { replace: true });
    } catch (e) {
      applyServerErrors(e, setError);
      setError('root', { message: e.message });
    }
  };

  return (
    <AuthShell title="Xush kelibsiz!" subtitle="Email va parolingiz bilan kiring — panelingiz rolingizga qarab avtomatik ochiladi.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {errors.root && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errors.root.message}</div>}
        <TextField label="Email" type="email" autoComplete="email" placeholder="siz@gmail.com" {...register('email')} error={errors.email?.message} />
        <PasswordField autoComplete="current-password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
        <div className="-mt-2 mb-5 text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">Parolni unutdingizmi?</Link>
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isSubmitting}>
          <LogIn /> {isSubmitting ? 'Tekshirilmoqda...' : 'Kirish'}
        </button>
        <p className="mt-6 text-center text-sm text-muted">
          Hisobingiz yo'qmi? <Link to="/register" className="font-semibold text-brand-700 hover:underline">Ro'yxatdan o'ting</Link>
        </p>
      </form>
    </AuthShell>
  );
}

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Ism kamida 2 ta harf').max(60),
    lastName: z.string().trim().min(2, 'Familiya kamida 2 ta harf').max(60),
    email: z.string().trim().min(1, 'Email kiriting').email('Email noto\'g\'ri formatda'),
    password: z.string()
      .min(8, 'Parol kamida 8 ta belgi')
      .regex(/[A-Za-z]/, 'Parolda kamida bitta harf bo\'lsin')
      .regex(/\d/, 'Parolda kamida bitta raqam bo\'lsin'),
    confirmPassword: z.string().min(1, 'Parolni tasdiqlang'),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Parollar mos kelmadi' });

export function Register() {
  useTitle('Ro\'yxatdan o\'tish');
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    try {
      const user = await signUp(values);
      toast.success('Hisob yaratildi! Xush kelibsiz.');
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    } catch (e) {
      applyServerErrors(e, setError);
      if (!e.errors?.length) setError('root', { message: e.message });
      toast.error(e.message);
    }
  };

  return (
    <AuthShell title="Ro'yxatdan o'tish" subtitle="Bir daqiqada talaba hisobini oching va o'qishni boshlang.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {errors.root && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errors.root.message}</div>}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField label="Ism" autoComplete="given-name" {...register('firstName')} error={errors.firstName?.message} />
          <TextField label="Familiya" autoComplete="family-name" {...register('lastName')} error={errors.lastName?.message} />
        </div>
        <TextField label="Email" type="email" autoComplete="email" placeholder="siz@gmail.com" {...register('email')} error={errors.email?.message} />
        <PasswordField autoComplete="new-password" hint="Kamida 8 ta belgi, harf va raqam" {...register('password')} error={errors.password?.message} />
        <PasswordField label="Parolni tasdiqlang" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
        <button type="submit" className="btn btn-primary btn-lg mt-1 w-full" disabled={isSubmitting}>
          <UserPlus /> {isSubmitting ? 'Yaratilmoqda...' : 'Hisob yaratish'}
        </button>
        <p className="mt-6 text-center text-sm text-muted">
          Hisobingiz bormi? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Kirish</Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted">O'qituvchi bo'lmoqchimisiz? Ro'yxatdan o'ting va administratorga murojaat qiling.</p>
      </form>
    </AuthShell>
  );
}

// Email servisi ulanmagan — shuning uchun "xat yuborildi" deb yolg'on ko'rsatmaymiz.
export function ForgotPassword() {
  useTitle('Parolni tiklash');
  return (
    <AuthShell title="Parolni tiklash" subtitle="Parolni email orqali tiklash keyingi bosqichda qo'shiladi.">
      <div className="card flex gap-4 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><KeyRound className="size-5" /></span>
        <p className="text-ink/80">
          Hozircha email servisi sozlanmagan. Parolingizni unutgan bo'lsangiz, <Link to="/contact" className="font-semibold text-brand-700 hover:underline">Bog'lanish</Link> sahifasi orqali
          administratorga yozing. Tizimga kira olsangiz, parolni Profil sahifasida o'zgartirishingiz mumkin.
        </p>
      </div>
      <Link to="/login" className="btn btn-outline mt-6 w-full">Kirish sahifasiga qaytish</Link>
    </AuthShell>
  );
}
