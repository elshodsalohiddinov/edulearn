// O'qituvchilar ro'yxati va o'qituvchi profili
import { Link, useParams } from 'react-router';
import { BookOpen, Users } from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import { Avatar, Breadcrumbs, EmptyState, ErrorState, PageLoader, SkeletonGrid } from '../../components/ui';
import { publicApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';
import { fullName } from '../../utils/format';
import NotFound from './NotFound';

export default function Teachers() {
  useTitle('O\'qituvchilar');
  const { data, loading, error, reload } = useFetch(() => publicApi.teachers(), []);
  return (
    <div className="container-page pt-8">
      <Breadcrumbs items={[["Bosh sahifa", "/"], ["O'qituvchilar"]]} />
      <h1 className="text-3xl font-bold">O'qituvchilar</h1>
      <p className="mb-8 mt-1 text-muted">Platformadagi kurs mualliflari.</p>
      {loading && <SkeletonGrid className="h-40" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && !data.length && <div className="card"><EmptyState icon={Users} title="Hozircha o'qituvchilar yo'q" /></div>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((t) => (
          <Link key={t.id} to={`/teachers/${t.id}`} className="card flex flex-col items-center p-6 text-center transition hover:-translate-y-1 hover:shadow-pop">
            <Avatar user={t} size="size-20 text-2xl" />
            <h2 className="mt-4 text-lg font-bold">{fullName(t)}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{t.bio || 'O\'qituvchi'}</p>
            <div className="mt-4 flex gap-5 text-sm text-ink/75">
              <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4" />{t.courseCount} kurs</span>
              <span className="inline-flex items-center gap-1.5"><Users className="size-4" />{t.studentCount} talaba</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TeacherProfile() {
  const { id } = useParams();
  const { data: t, loading, error, reload } = useFetch(() => publicApi.teacher(id), [id]);
  useTitle(t ? fullName(t) : 'O\'qituvchi');
  if (loading) return <PageLoader />;
  if (error?.status === 404 || error?.status === 400) return <NotFound />;
  if (error) return <div className="container-page pt-10"><ErrorState error={error} onRetry={reload} /></div>;
  return (
    <div className="container-page pt-8">
      <Breadcrumbs items={[["Bosh sahifa", "/"], ["O'qituvchilar", "/teachers"], [fullName(t)]]} />
      <section className="card flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:text-left">
        <Avatar user={t} size="size-24 text-3xl" />
        <div>
          <p className="text-sm font-semibold text-brand-600">O'qituvchi</p>
          <h1 className="text-3xl font-bold">{fullName(t)}</h1>
          <p className="mt-2 max-w-2xl text-ink/75">{t.bio}</p>
          <div className="mt-3 flex justify-center gap-5 text-sm text-ink/75 sm:justify-start">
            <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4" />{t.courseCount} kurs</span>
            <span className="inline-flex items-center gap-1.5"><Users className="size-4" />{t.studentCount} talaba</span>
          </div>
        </div>
      </section>
      <h2 className="mb-5 mt-10 text-2xl font-bold">Kurslari</h2>
      {t.courses.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{t.courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
      ) : <div className="card"><EmptyState title="Nashr qilingan kurslar hali yo'q" /></div>}
    </div>
  );
}
