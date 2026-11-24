// Bosh sahifa (landing): hero, qidiruv, kategoriyalar, mashhur kurslar, raqamlar, o'qituvchilar, afzalliklar.
import { Link, useNavigate } from 'react-router';
import {
  ArrowRight, Award, BarChart3, BookOpen, CalendarClock, Code2, Infinity as InfinityIcon, LogIn, PlayCircle, Search,
  Sparkles, UserPlus, Users,
} from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import { Avatar, ErrorState, SkeletonGrid } from '../../components/ui';
import { categoriesApi, coursesApi, publicApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';
import { useAuth } from '../../contexts/AuthContext';
import { LEVELS, categoryStyle, fullName } from '../../utils/format';

function SectionHead({ icon: Icon, title, subtitle, link }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-bold"><Icon className="size-6 text-brand-600" aria-hidden="true" />{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {link}
    </div>
  );
}

function HeroArt() {
  return (
    <div className="relative mx-auto h-80 w-full max-w-lg sm:h-96" aria-hidden="true">
      <div className="absolute inset-x-6 bottom-0 top-6 rounded-[48%_52%_40%_60%/55%_45%_55%_45%] bg-gradient-to-br from-brand-200 via-brand-400 to-brand-600" />
      <div className="absolute inset-x-[18%] bottom-10">
        <div className="flex h-44 flex-col gap-2.5 rounded-t-2xl border-8 border-[#2a2660] bg-[#1e1b4b] p-5 sm:h-52">
          <i className="h-2.5 rounded bg-brand-400" />
          <i className="h-2.5 w-2/3 rounded bg-pink-400" />
          <i className="h-2.5 w-4/5 rounded bg-sky-400" />
          <i className="h-2.5 w-1/2 rounded bg-violet-300" />
          <i className="h-2.5 w-3/4 rounded bg-emerald-400" />
        </div>
        <div className="-mx-6 h-3.5 rounded-b-2xl bg-[#d7d2ee]" />
      </div>
      {[
        ['left-0 top-6', Code2, 'Dasturlash', 'amaliy darslar', 'bg-brand-50 text-brand-600'],
        ['right-0 top-16', BarChart3, 'Progress', 'har bir dars', 'bg-pink-50 text-pink-600'],
        ['bottom-2 left-2', Award, 'Yakunlash', 'kurs oxirida', 'bg-emerald-50 text-emerald-600'],
      ].map(([pos, Icon, t, s, c]) => (
        <div key={t} className={`absolute ${pos} flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-pop`}>
          <span className={`grid size-9 place-items-center rounded-xl ${c}`}><Icon className="size-5" /></span>
          <span className="text-sm font-semibold leading-tight">{t}<span className="block text-xs font-normal text-muted">{s}</span></span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  useTitle('');
  const { user, homePath } = useAuth();
  const navigate = useNavigate();
  const popular = useFetch(() => coursesApi.list({ sort: 'popular', limit: 6 }), []);
  const cats = useFetch(() => categoriesApi.list(), []);
  const stats = useFetch(() => publicApi.stats(), []);
  const teachers = useFetch(() => publicApi.teachers(), []);

  const onSearch = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const qs = new URLSearchParams([...form].filter(([, v]) => v));
    navigate(`/courses?${qs}`);
  };

  return (
    <>
      <section className="bg-[radial-gradient(1200px_500px_at_85%_10%,#ece6ff_0%,transparent_60%),linear-gradient(180deg,#fff,#f7f6fc)] pt-10 sm:pt-14">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-700">
              <Sparkles className="size-4" aria-hidden="true" /> Zamonaviy onlayn ta'lim platformasi
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-[54px]">
              Onlayn ta'lim bilan bilim va karyerangizni <span className="text-brand-600">keyingi bosqichga</span> olib chiqing!
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink/70">
              Sifatli kurslar, tajribali o'qituvchilar va amaliy darslar orqali yangi ko'nikmalarni o'rganing va progressingizni kuzating.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/courses" className="btn btn-primary btn-lg"><PlayCircle /> Kurslarni ko'rish</Link>
              {user
                ? <Link to={homePath} className="btn btn-outline btn-lg">Mening panelim</Link>
                : <Link to="/register" className="btn btn-outline btn-lg"><UserPlus /> Bepul ro'yxatdan o'tish</Link>}
            </div>
          </div>
          <HeroArt />
        </div>

        <div className="container-page relative z-10 mt-10 pb-2">
          <form onSubmit={onSearch} className="card grid gap-3 p-3 sm:p-4 md:grid-cols-[1fr_200px_200px_auto]" role="search">
            <label className="relative">
              <span className="sr-only">Kurslarni qidirish</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input name="search" className="input pl-11" placeholder="Kurslarni qidiring... (masalan: Python, Figma)" />
            </label>
            <label>
              <span className="sr-only">Kategoriya</span>
              <select name="category" className="input" defaultValue="">
                <option value="">Barcha yo'nalishlar</option>
                {(cats.data || []).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Daraja</span>
              <select name="level" className="input" defaultValue="">
                <option value="">Barcha darajalar</option>
                {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <button type="submit" className="btn btn-primary"><Search /> Qidirish</button>
          </form>
        </div>
      </section>

      <section className="container-page mt-14">
        <SectionHead
          icon={Award}
          title="Mashhur kurslar"
          subtitle="Eng ko'p talaba yozilgan kurslar"
          link={<Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">Barcha kurslar <ArrowRight className="size-4" /></Link>}
        />
        {popular.loading && <SkeletonGrid />}
        {popular.error && <ErrorState error={popular.error} onRetry={popular.reload} />}
        {popular.data && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popular.data.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </section>

      <section className="container-page mt-16 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHead icon={BookOpen} title="Yo'nalishlar" subtitle="O'zingizga mos yo'nalishni tanlang" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(cats.data || []).map((c) => {
              const { icon: Icon } = categoryStyle(c.slug);
              return (
                <Link key={c.id} to={`/courses?category=${c.slug}`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-300">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" aria-hidden="true" /></span>
                  <span className="min-w-0"><span className="block truncate font-semibold">{c.name}</span><span className="text-sm text-muted">{c.courseCount} ta kurs</span></span>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <SectionHead icon={BarChart3} title="Platforma raqamlarda" subtitle="Ma'lumotlar bazasidan jonli olinadi" />
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Talabalar', stats.data?.students, Users, 'bg-brand-50 text-brand-600'],
              ['Kurslar', stats.data?.courses, BookOpen, 'bg-sky-50 text-sky-600'],
              ['O\'qituvchilar', stats.data?.teachers, Award, 'bg-emerald-50 text-emerald-600'],
              ['Darslar', stats.data?.lessons, PlayCircle, 'bg-amber-50 text-amber-600'],
            ].map(([label, n, Icon, cls]) => (
              <div key={label} className={`flex items-center gap-3 rounded-2xl p-4 ${cls}`}>
                <span className="grid size-11 place-items-center rounded-full bg-white/80"><Icon className="size-5" aria-hidden="true" /></span>
                <span><span className="block text-2xl font-bold text-ink tabular-nums">{n ?? '—'}</span><span className="text-sm text-ink/70">{label}</span></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHead
          icon={Users}
          title="Bizning o'qituvchilar"
          subtitle="O'z sohasining mutaxassislari"
          link={<Link to="/teachers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">Barchasi <ArrowRight className="size-4" /></Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(teachers.data || []).slice(0, 3).map((t) => (
            <Link key={t.id} to={`/teachers/${t.id}`} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
              <Avatar user={t} size="size-16 text-xl" />
              <div className="min-w-0">
                <p className="font-bold">{fullName(t)}</p>
                <p className="line-clamp-2 text-sm text-muted">{t.bio}</p>
                <p className="mt-1.5 text-sm text-ink/70">{t.courseCount} kurs · {t.studentCount} talaba</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHead icon={Sparkles} title="Nega aynan EduLearn?" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [CalendarClock, 'Moslashuvchan ta\'lim', 'O\'zingizga qulay vaqtda, istalgan joyda o\'qing.'],
            [BarChart3, 'Progress kuzatuvi', 'Har bir kurs bo\'yicha natijangiz foizda ko\'rinadi.'],
            [Users, 'Tajribali o\'qituvchilar', 'Kurslarni amaliyotchi mutaxassislar tayyorlaydi.'],
            [InfinityIcon, 'Cheksiz kirish', 'Yozilgan kurs materiallari doim siz bilan.'],
          ].map(([Icon, t, d]) => (
            <div key={t} className="card flex gap-4 p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-6" aria-hidden="true" /></span>
              <div><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      {!user && (
        <section className="container-page mt-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 p-8 text-white sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">O'qishni bugun boshlang</h2>
              <p className="mt-2 text-white/80">Ro'yxatdan o'ting va birinchi kursingizga bir daqiqada yoziling.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-lg bg-white text-brand-700 hover:bg-brand-50"><UserPlus /> Ro'yxatdan o'tish</Link>
              <Link to="/login" className="btn btn-lg border-white/40 text-white hover:bg-white/10"><LogIn /> Kirish</Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
