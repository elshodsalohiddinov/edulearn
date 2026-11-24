// Talaba paneli: bosh sahifa, barcha kurslar, mening kurslarim, progress.
import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, GraduationCap, Layers, PlayCircle, Search, Signal } from 'lucide-react';
import CourseCatalog from '../../components/CourseCatalog';
import { CourseThumb } from '../../components/CourseCard';
import { EmptyState, ErrorState, PageHeader, ProgressBar, SkeletonGrid, StatCard } from '../../components/ui';
import { coursesApi, enrollmentApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';
import { useAuth } from '../../contexts/AuthContext';
import { LEVELS, cn, formatDate, fullName } from '../../utils/format';

function MyCourseCard({ item }) {
  const { course, progress } = item;
  const url = progress.nextLessonId ? `/student/learn/${course.id}/${progress.nextLessonId}` : `/courses/${course.slug}`;
  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row">
      <CourseThumb course={course} className="h-32 rounded-xl sm:h-28 sm:w-36 sm:shrink-0" iconSize="size-12" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div>
          <Link to={`/courses/${course.slug}`} className="text-[17px] font-bold hover:text-brand-700">{course.title}</Link>
          <p className="text-sm text-muted">{fullName(course.teacher)} · {progress.total} dars</p>
        </div>
        <ProgressBar value={progress.percent} />
        <div className="flex flex-wrap items-center gap-2">
          {progress.isCompleted
            ? <span className="badge bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-3.5" /> Yakunlangan</span>
            : <span className="text-sm text-muted">{progress.completed} / {progress.total} dars tugatildi</span>}
          {progress.total > 0 && (
            <Link to={url} className="btn btn-primary btn-sm ml-auto">
              {progress.isCompleted ? 'Qayta ko\'rish' : progress.completed ? 'Davom ettirish' : 'Boshlash'} <PlayCircle />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentDashboard() {
  useTitle('Talaba paneli');
  const { user } = useAuth();
  const mine = useFetch(() => enrollmentApi.mine(), []);
  const rec = useFetch(() => coursesApi.list({ sort: 'popular', limit: 9 }), []);

  const items = mine.data || [];
  const active = items.filter((i) => !i.progress.isCompleted);
  const recommended = (rec.data || []).filter((c) => !c.isEnrolled).slice(0, 3);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Xush kelibsiz, {user.firstName}! 👋</h1>
        <p className="mt-1 text-muted">Kurslaringizni davom ettiring, yangi bilimlar o'rganing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={GraduationCap} label="Mening kurslarim" value={mine.meta?.total ?? '—'} />
        <StatCard icon={PlayCircle} label="Jarayondagi kurslar" value={mine.meta?.inProgress ?? '—'} tone="blue" />
        <StatCard icon={CheckCircle2} label="Yakunlangan kurslar" value={mine.meta?.completed ?? '—'} tone="green" />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Davom ettirish</h2>
          <Link to="/student/my-courses" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Barchasini ko'rish <ArrowRight className="size-4" /></Link>
        </div>
        {mine.loading && <SkeletonGrid count={2} className="h-36" />}
        {mine.error && <ErrorState error={mine.error} onRetry={mine.reload} />}
        {!mine.loading && !mine.error && (items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">{(active.length ? active : items).slice(0, 4).map((i) => <MyCourseCard key={i.enrollmentId} item={i} />)}</div>
        ) : (
          <div className="card"><EmptyState icon={BookOpen} title="Hali hech qaysi kursga yozilmagansiz" text="Katalogdan o'zingizga yoqqan kursni tanlang." action={<Link to="/student/courses" className="btn btn-primary">Kurslarni ko'rish</Link>} /></div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Tavsiya etilgan kurslar</h2>
          <Link to="/student/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Katalog <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recommended.map((c) => (
            <div key={c.id} className="card flex flex-col gap-4 p-4">
              <div className="flex gap-3">
                <CourseThumb course={c} className="size-16 shrink-0 rounded-xl" iconSize="size-10" />
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-bold">{c.title}</h3>
                  <p className="mt-1 flex gap-3 text-sm text-muted">
                    <span className="inline-flex items-center gap-1"><BookOpen className="size-4" />{c.lessonCount} dars</span>
                    <span className="inline-flex items-center gap-1"><Signal className="size-4" />{LEVELS[c.level]}</span>
                  </p>
                </div>
              </div>
              <Link to={`/courses/${c.slug}`} className="btn btn-outline mt-auto w-full">Kursga yozilish</Link>
            </div>
          ))}
          {!rec.loading && !recommended.length && <p className="text-muted">Barcha kurslarga yozilgansiz — ajoyib!</p>}
        </div>
      </section>
    </div>
  );
}

export function StudentCourses() {
  useTitle('Barcha kurslar');
  return (
    <div>
      <PageHeader title="Barcha kurslar" subtitle="Qidiring, filtrlang va yangi kursga yoziling." />
      <CourseCatalog />
    </div>
  );
}

const FILTERS = [['all', 'Barchasi'], ['active', 'Davom etayotgan'], ['done', 'Yakunlangan']];

export function MyCourses() {
  useTitle('Mening kurslarim');
  const { data, meta, loading, error, reload } = useFetch(() => enrollmentApi.mine(), []);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  // Filtr va qidiruv brauzerda bajariladi — talabaning kurslari soni kichik
  const q = query.trim().toLowerCase();
  const items = (data || [])
    .filter((i) => (filter === 'all' ? true : filter === 'done' ? i.progress.isCompleted : !i.progress.isCompleted))
    .filter((i) => !q || i.course.title.toLowerCase().includes(q) || fullName(i.course.teacher).toLowerCase().includes(q));

  return (
    <div>
      <PageHeader
        title="Mening kurslarim"
        subtitle={meta ? `${meta.total} ta kurs · ${meta.inProgress} tasi davom etmoqda · ${meta.completed} tasi yakunlangan` : undefined}
        actions={<Link to="/student/courses" className="btn btn-primary"><Layers /> Yangi kurs topish</Link>}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5" role="tablist" aria-label="Holat bo'yicha filtr">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn('btn btn-sm', filter === key ? 'btn-primary' : 'btn-outline')}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative ml-auto w-full sm:w-72">
          <span className="sr-only">Kurs yoki o'qituvchi bo'yicha qidirish</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" className="input pl-11" placeholder="Kurs yoki o'qituvchi..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      {loading && <SkeletonGrid count={4} className="h-36" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (data.length === 0 ? (
        <div className="card"><EmptyState icon={BookOpen} title="Hali kursga yozilmagansiz" text="Katalogdan o'zingizga yoqqan kursni tanlang." action={<Link to="/student/courses" className="btn btn-primary">Kurslarni ko'rish</Link>} /></div>
      ) : items.length ? (
        <div className="grid gap-4 xl:grid-cols-2">{items.map((i) => <MyCourseCard key={i.enrollmentId} item={i} />)}</div>
      ) : (
        <div className="card"><EmptyState icon={Search} title="Mos kurs topilmadi" text="Filtrni yoki qidiruv so'zini o'zgartirib ko'ring." /></div>
      ))}
    </div>
  );
}

// Progress: har bir kurs bo'yicha tugatilgan darslar va foiz (formula: tugatilgan / jami × 100)
export function StudentProgress() {
  useTitle('Progress');
  const { data, meta, loading, error, reload } = useFetch(() => enrollmentApi.mine(), []);
  const items = data || [];
  const totalLessons = items.reduce((s, i) => s + i.progress.total, 0);
  const doneLessons = items.reduce((s, i) => s + i.progress.completed, 0);
  const overall = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;

  return (
    <div>
      <PageHeader title="Progress" subtitle="Har bir kurs bo'yicha o'qish natijalaringiz" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BarChart3} label="Umumiy progress" value={loading ? '—' : `${overall}%`} />
        <StatCard icon={PlayCircle} label="Tugatilgan darslar" value={loading ? '—' : `${doneLessons} / ${totalLessons}`} tone="blue" />
        <StatCard icon={CheckCircle2} label="Yakunlangan kurslar" value={meta?.completed ?? '—'} tone="green" />
      </div>
      <div className="mt-6">
        {loading && <SkeletonGrid count={1} className="h-64" />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && (items.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 font-semibold">Kurs</th>
                  <th className="px-4 py-3 font-semibold">Darslar</th>
                  <th className="w-2/5 px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Yozilgan sana</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.enrollmentId} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link to={`/courses/${i.course.slug}`} className="font-semibold hover:text-brand-700">{i.course.title}</Link>
                      <p className="text-muted">{fullName(i.course.teacher)}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{i.progress.completed} / {i.progress.total}</td>
                    <td className="px-4 py-3"><ProgressBar value={i.progress.percent} /></td>
                    <td className="px-4 py-3 text-muted">{formatDate(i.enrolledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="card"><EmptyState icon={BarChart3} title="Hali progress yo'q" text="Kursga yozilib, birinchi darsni tugating." action={<Link to="/student/courses" className="btn btn-primary">Kurslarni ko'rish</Link>} /></div>)}
      </div>
    </div>
  );
}
