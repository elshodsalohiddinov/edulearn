// O'qituvchi paneli: statistika, kurslar ro'yxati, kurs formasi (yaratish/tahrirlash).
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { BookOpen, Eye, EyeOff, ListOrdered, Pencil, PlayCircle, Plus, Rocket, Trash2, Users } from 'lucide-react';
import { CourseThumb } from '../../components/CourseCard';
import { TextField, applyServerErrors } from '../../components/FormField';
import { useConfirm } from '../../components/Modal';
import { EmptyState, ErrorState, LevelBadge, PageHeader, PageLoader, SkeletonGrid, StatCard, StatusBadge } from '../../components/ui';
import { categoriesApi, coursesApi, teacherApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';
import { useAuth } from '../../contexts/AuthContext';
import { LEVELS } from '../../utils/format';
import NotFound from '../public/NotFound';

function useCourseActions(reload) {
  const confirm = useConfirm();
  const remove = async (c) => {
    const ok = await confirm({
      title: 'Kursni o\'chirish',
      message: `"${c.title}" kursi, uning barcha darslari va talabalarning progressi o'chiriladi. Bu amalni qaytarib bo'lmaydi.`,
      confirmText: 'O\'chirish',
      danger: true,
    });
    if (!ok) return;
    try {
      await coursesApi.remove(c.id);
      toast.success('Kurs o\'chirildi');
      reload();
    } catch (e) { toast.error(e.message); }
  };
  // Nashr qilish / qoralamaga qaytarish. Backend darssiz kursni nashr qildirmaydi (422).
  const setStatus = async (c, status) => {
    try {
      await coursesApi.update(c.id, { status });
      toast.success(status === 'PUBLISHED' ? 'Kurs nashr qilindi — endi katalogda ko\'rinadi' : 'Kurs qoralamaga qaytarildi');
      reload();
    } catch (e) { toast.error(e.message); }
  };
  return { remove, setStatus };
}

function CoursesTable({ items, reload }) {
  const { remove, setStatus } = useCourseActions(reload);
  if (!items.length) {
    return (
      <div className="card">
        <EmptyState icon={BookOpen} title="Hali kurs yaratmagansiz" text="Birinchi kursingizni yarating va unga darslar qo'shing." action={<Link to="/teacher/courses/new" className="btn btn-primary"><Plus /> Yangi kurs</Link>} />
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      {items.map((c) => (
        <div key={c.id} className="card flex flex-col gap-4 p-4 md:flex-row md:items-center">
          <CourseThumb course={c} className="h-28 rounded-xl md:h-20 md:w-28 md:shrink-0" iconSize="size-10" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={c.status} />
              <LevelBadge level={c.level} />
              <span className="text-xs text-muted">{c.category.name}</span>
            </div>
            <h3 className="mt-1.5 truncate text-lg font-bold">{c.title}</h3>
            <p className="line-clamp-1 text-sm text-muted">{c.shortDescription}</p>
            <p className="text-sm text-muted">{c.lessonCount} dars · {c.studentCount} talaba</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(c.status === 'DRAFT' || c.status === 'PENDING') && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setStatus(c, 'PUBLISHED')} disabled={!c.lessonCount} title={c.lessonCount ? 'Katalogda ko\'rinsin' : 'Avval kamida bitta dars qo\'shing'}>
                <Rocket /> Nashr qilish
              </button>
            )}
            {c.status === 'PUBLISHED' && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setStatus(c, 'DRAFT')}>
                <EyeOff /> Qoralamaga
              </button>
            )}
            {c.status === 'ARCHIVED' && <span className="badge bg-red-50 text-red-600">Admin yashirgan</span>}
            <Link to={`/teacher/courses/${c.id}/lessons`} className="btn btn-outline btn-sm"><ListOrdered /> Darslar</Link>
            <Link to={`/teacher/courses/${c.id}/students`} className="btn btn-outline btn-sm"><Users /> Talabalar</Link>
            <Link to={`/courses/${c.slug}`} className="btn btn-ghost btn-sm btn-icon" aria-label="Ko'rish"><Eye /></Link>
            <Link to={`/teacher/courses/${c.id}/edit`} className="btn btn-ghost btn-sm btn-icon" aria-label="Tahrirlash"><Pencil /></Link>
            <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => remove(c)} aria-label="O'chirish"><Trash2 /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TeacherDashboard() {
  useTitle('O\'qituvchi paneli');
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => teacherApi.courses(), []);
  const items = data || [];
  const sum = (k) => items.reduce((s, c) => s + c[k], 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Xush kelibsiz, {user.firstName}! 👋</h1>
          <p className="mt-1 text-muted">Kurslaringizni boshqaring va talabalaringiz o'sishini kuzating.</p>
        </div>
        <Link to="/teacher/courses/new" className="btn btn-primary"><Plus /> Yangi kurs</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Mening kurslarim" value={loading ? '—' : items.length} />
        <StatCard icon={Users} label="Jami yozilishlar" value={loading ? '—' : sum('studentCount')} tone="blue" />
        <StatCard icon={PlayCircle} label="Jami darslar" value={loading ? '—' : sum('lessonCount')} tone="green" />
        <StatCard icon={Rocket} label="Nashr qilingan" value={loading ? '—' : items.filter((c) => c.status === 'PUBLISHED').length} tone="amber" />
      </div>
      <h2 className="mb-4 mt-8 text-xl font-bold">Oxirgi kurslar</h2>
      {loading && <SkeletonGrid count={3} className="h-24" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && <CoursesTable items={items.slice(0, 5)} reload={reload} />}
    </div>
  );
}

export function TeacherCourses() {
  useTitle('Mening kurslarim');
  const { data, loading, error, reload } = useFetch(() => teacherApi.courses(), []);
  return (
    <div>
      <PageHeader
        title="Mening kurslarim"
        subtitle="Yangi kurs qoralama sifatida yaratiladi. Darslar qo'shib, «Nashr qilish» ni bosing — kurs katalogda ko'rinadi."
        actions={<Link to="/teacher/courses/new" className="btn btn-primary"><Plus /> Yangi kurs</Link>}
      />
      {loading && <SkeletonGrid count={3} className="h-24" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && <CoursesTable items={data} reload={reload} />}
    </div>
  );
}

const courseSchema = z.object({
  title: z.string().trim().min(3, 'Kamida 3 ta belgi').max(150),
  shortDescription: z.string().trim().min(10, 'Qisqa tavsif kamida 10 ta belgi').max(200, 'Ko\'pi bilan 200 ta belgi'),
  description: z.string().trim().min(10, 'Tavsif kamida 10 ta belgidan iborat bo\'lsin').max(5000),
  categoryId: z.coerce.number({ message: 'Kategoriyani tanlang' }).int().positive('Kategoriyani tanlang'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  thumbnailUrl: z.union([z.literal(''), z.string().trim().url('To\'g\'ri havola kiriting (https://...)')]).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export function CourseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useTitle(isEdit ? 'Kursni tahrirlash' : 'Yangi kurs');
  const navigate = useNavigate();
  const cats = useFetch(() => categoriesApi.list(), []);
  const existing = useFetch(() => (isEdit ? coursesApi.get(id) : Promise.resolve(null)), [id]);

  const { register, handleSubmit, reset, setError, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: '', shortDescription: '', description: '', categoryId: '', level: 'BEGINNER', thumbnailUrl: '', status: 'DRAFT' },
  });

  useEffect(() => {
    const c = existing.data;
    if (c) reset({ title: c.title, shortDescription: c.shortDescription, description: c.description, categoryId: c.categoryId, level: c.level, thumbnailUrl: c.thumbnailUrl || '', status: c.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT' });
  }, [existing.data, reset]);

  if (existing.loading) return <PageLoader />;
  if (existing.error) return existing.error.status === 404 ? <NotFound /> : <ErrorState error={existing.error} onRetry={existing.reload} />;
  if (isEdit && existing.data && !existing.data.viewer.canManage) return <NotFound />;

  const onSubmit = async (values) => {
    try {
      const body = { ...values };
      // Yangi kursda dars hali yo'q — u qoralama bo'lib yaratiladi; admin yashirgan kurs holatiga tegmaymiz
      if (!isEdit || existing.data?.status === 'ARCHIVED') delete body.status;
      const c = isEdit ? await coursesApi.update(id, body) : await coursesApi.create(body);
      toast.success(isEdit ? 'Kurs saqlandi' : 'Kurs yaratildi. Endi darslar qo\'shing!');
      navigate(isEdit ? '/teacher/courses' : `/teacher/courses/${c.id}/lessons`);
    } catch (e) {
      applyServerErrors(e, setError);
      toast.error(e.message);
    }
  };

  const preview = { category: cats.data?.find((c) => c.id === Number(watch('categoryId'))), thumbnailUrl: watch('thumbnailUrl') };

  return (
    <div className="max-w-4xl">
      <PageHeader title={isEdit ? 'Kursni tahrirlash' : 'Yangi kurs'} subtitle={isEdit ? existing.data?.title : 'Kurs ma\'lumotlarini to\'ldiring'} />
      <form className="card grid gap-6 p-6 md:grid-cols-[1fr_240px]" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <TextField label="Kurs nomi" placeholder="Masalan: React.js asoslari" {...register('title')} error={errors.title?.message} />
          <TextField label="Qisqa tavsif" placeholder="Kurs kartasida ko'rinadigan 1 gap" hint="10–200 belgi" {...register('shortDescription')} error={errors.shortDescription?.message} />
          <TextField label="To'liq tavsif" as="textarea" rows={5} placeholder="Kurs nima haqida, kimlar uchun, nimalarni o'rganadi?" {...register('description')} error={errors.description?.message} />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <TextField label="Kategoriya" as="select" {...register('categoryId')} error={errors.categoryId?.message}>
              <option value="">Tanlang...</option>
              {(cats.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </TextField>
            <TextField label="Daraja" as="select" {...register('level')} error={errors.level?.message}>
              {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </TextField>
          </div>
          <TextField label="Muqova rasmi havolasi (ixtiyoriy)" placeholder="https://..." hint="Bo'sh qoldirilsa, kategoriya rangidagi muqova ishlatiladi" {...register('thumbnailUrl')} error={errors.thumbnailUrl?.message} />
          {isEdit && existing.data?.status !== 'ARCHIVED' && (
            <TextField label="Holat" as="select" hint="Nashr qilish uchun kursda kamida bitta dars bo'lishi kerak" {...register('status')} error={errors.status?.message}>
              <option value="DRAFT">Qoralama (faqat siz ko'rasiz)</option>
              <option value="PUBLISHED">Nashr (katalogda hamma ko'radi)</option>
            </TextField>
          )}
          {!isEdit && <p className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Kurs qoralama sifatida yaratiladi. Keyingi qadamda darslar qo'shasiz va kursni nashr qilasiz.</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : 'Kursni yaratish'}</button>
            <Link to="/teacher/courses" className="btn btn-outline">Bekor qilish</Link>
          </div>
        </div>
        <div>
          <p className="label">Muqova ko'rinishi</p>
          <CourseThumb course={preview} className="h-36 rounded-xl" iconSize="size-14" />
        </div>
      </form>
    </div>
  );
}
