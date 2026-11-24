// Super admin statistikasi. Barcha raqamlar /admin/stats dan — bazadan hisoblangan haqiqiy qiymatlar.
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, Clock, GraduationCap, Layers, Mail, UserCog, Users } from 'lucide-react';
import { ErrorState, PageHeader, PageLoader, StatCard } from '../../components/ui';
import { adminApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';

const BRAND = '#5B35E6';
const GRID = '#ebe8f5';
const MUTED = '#6b6886';

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-pop">
      <p className="font-semibold text-ink">{label}</p>
      <p className="text-muted">{payload[0].value} {unit}</p>
    </div>
  );
}

// Har bir grafik ostida jadval ko'rinishi — rangni ko'ra olmaydigan va ekran o'qish dasturlari uchun
function ChartCard({ title, subtitle, data, labelKey, valueKey, unit, children }) {
  return (
    <section className="card p-5">
      <h2 className="font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      <div className="mt-4 h-64">{children}</div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-brand-700">Jadval ko'rinishi</summary>
        <table className="mt-2 w-full">
          <tbody>
            {data.map((d) => (
              <tr key={d[labelKey]} className="border-b border-line last:border-0">
                <td className="py-1.5">{d[labelKey]}</td>
                <td className="py-1.5 text-right font-semibold tabular-nums">{d[valueKey]} {unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

const axisProps = { tickLine: false, axisLine: false, tick: { fill: MUTED, fontSize: 12 } };

export default function AdminDashboard() {
  useTitle('Admin statistikasi');
  const { data: s, loading, error, reload } = useFetch(() => adminApi.stats(), []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Platforma statistikasi" subtitle="Barcha ko'rsatkichlar ma'lumotlar bazasidan jonli hisoblanadi." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Talabalar" value={s.users.students} />
        <StatCard icon={UserCog} label="O'qituvchilar" value={s.users.teachers} tone="blue" />
        <StatCard icon={GraduationCap} label="Nashr qilingan kurslar" value={`${s.courses.published} / ${s.courses.total}`} tone="green" />
        <StatCard icon={Layers} label="Yozilishlar" value={s.enrollments} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link to="/admin/courses?status=PENDING" className="card flex items-center gap-3 p-4 hover:border-amber-300">
          <Clock className="size-5 text-amber-600" aria-hidden="true" />
          <span className="flex-1">Tekshiruvni kutayotgan kurslar</span>
          <span className="badge bg-amber-50 text-amber-700">{s.courses.pending}</span>
        </Link>
        <Link to="/admin/messages" className="card flex items-center gap-3 p-4 hover:border-brand-300">
          <Mail className="size-5 text-brand-600" aria-hidden="true" />
          <span className="flex-1">O'qilmagan xabarlar</span>
          <span className="badge bg-brand-50 text-brand-700">{s.unreadMessages}</span>
        </Link>
        <div className="card flex items-center gap-3 p-4">
          <BookOpen className="size-5 text-emerald-600" aria-hidden="true" />
          <span className="flex-1">Jami darslar</span>
          <span className="badge bg-emerald-50 text-emerald-700">{s.lessons}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Yozilishlar (oxirgi 6 oy)" subtitle="Har oyda kurslarga yozilgan talabalar soni" data={s.enrollmentsByMonth} labelKey="month" valueKey="count" unit="ta">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={s.enrollmentsByMonth} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip cursor={{ fill: '#f3f0ff' }} content={<ChartTooltip unit="ta yozilish" />} />
              <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Kategoriyalar bo'yicha kurslar" subtitle="Har bir kategoriyadagi kurslar soni (barcha holatlar)" data={s.coursesByCategory} labelKey="name" valueKey="count" unit="ta">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={s.coursesByCategory} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="name" width={92} {...axisProps} tick={{ fill: '#16142b', fontSize: 13 }} />
              <Tooltip cursor={{ fill: '#f3f0ff' }} content={<ChartTooltip unit="ta kurs" />} />
              <Bar dataKey="count" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="font-bold">Eng ommabop kurslar</h2>
        <ol className="mt-3 divide-y divide-line">
          {s.topCourses.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <span className="grid size-7 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
              <Link to={`/courses/${c.slug}`} className="flex-1 font-medium hover:text-brand-700">{c.title}</Link>
              <span className="text-sm text-muted tabular-nums">{c.students} talaba</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
