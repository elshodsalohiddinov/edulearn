// Super admin bosh sahifasi: asosiy raqamlar, so'nggi foydalanuvchilar va kurslar, bitta grafik.
import { Link } from 'react-router';
import { ArrowRight, GraduationCap, Layers, Mail, UserCheck, UserCog, Users } from 'lucide-react';
import { Avatar, ErrorState, PageHeader, PageLoader, RoleBadge, StatCard, StatusBadge } from '../../components/ui';
import { adminApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, fullName } from '../../utils/format';
import { EnrollmentsChart } from './AdminDashboard';

export default function AdminOverview() {
  useTitle('Umumiy ko\'rinish');
  const { user } = useAuth();
  const { data: s, loading, error, reload } = useFetch(() => adminApi.stats(), []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title={`Xush kelibsiz, ${user.firstName}!`} subtitle="Platformaning umumiy holati — barcha raqamlar bazadan olinadi." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Jami talabalar" value={s.users.students} />
        <StatCard icon={UserCog} label="O'qituvchilar" value={s.users.teachers} tone="blue" />
        <StatCard icon={GraduationCap} label="Kurslar" value={s.courses.total} tone="green" />
        <StatCard icon={Layers} label="Yozilishlar" value={s.enrollments} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link to="/admin/teacher-requests" className="card flex items-center gap-3 p-4 hover:border-brand-300">
          <UserCheck className="size-5 text-brand-600" aria-hidden="true" />
          <span className="flex-1">Ko'rib chiqilmagan o'qituvchi so'rovlari</span>
          <span className="badge bg-brand-50 text-brand-700">{s.pendingRequests}</span>
        </Link>
        <Link to="/admin/messages" className="card flex items-center gap-3 p-4 hover:border-brand-300">
          <Mail className="size-5 text-brand-600" aria-hidden="true" />
          <span className="flex-1">O'qilmagan xabarlar</span>
          <span className="badge bg-brand-50 text-brand-700">{s.unreadMessages}</span>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">So'nggi foydalanuvchilar</h2>
            <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Barchasi <ArrowRight className="size-4" /></Link>
          </div>
          <ul className="divide-y divide-line">
            {s.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <Avatar user={u} size="size-9 text-xs" />
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{fullName(u)}</p><p className="truncate text-sm text-muted">{u.email}</p></div>
                <div className="text-right"><RoleBadge role={u.role} /><p className="mt-0.5 text-xs text-muted">{formatDate(u.createdAt)}</p></div>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">So'nggi kurslar</h2>
            <Link to="/admin/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Barchasi <ArrowRight className="size-4" /></Link>
          </div>
          <ul className="divide-y divide-line">
            {s.recentCourses.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link to={`/courses/${c.slug}`} className="block truncate font-medium hover:text-brand-700">{c.title}</Link>
                  <p className="truncate text-sm text-muted">{fullName(c.teacher)} · {c.category.name}</p>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6"><EnrollmentsChart data={s.enrollmentsByMonth} /></div>
    </div>
  );
}
