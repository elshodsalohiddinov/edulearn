// Kurs darslarini boshqarish: qo'shish, tahrirlash, o'chirish, tartibini o'zgartirish.
// Kursga yozilgan talabalar ro'yxati va progressi ham shu faylda.
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { TextField, applyServerErrors } from '../../components/FormField';
import { Modal, useConfirm } from '../../components/Modal';
import { Avatar, EmptyState, ErrorState, PageHeader, PageLoader, ProgressBar, StatusBadge } from '../../components/ui';
import { coursesApi, lessonsApi, teacherApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';
import { formatDate, fullName } from '../../utils/format';
import NotFound from '../public/NotFound';

const lessonSchema = z.object({
  title: z.string().trim().min(3, 'Kamida 3 ta belgi').max(150),
  content: z.string().trim().min(1, 'Dars matni bo\'sh bo\'lmasligi kerak'),
  videoUrl: z.union([z.literal(''), z.string().trim().url('To\'g\'ri havola kiriting')]).optional(),
  durationMinutes: z.coerce.number().int().min(1, 'Kamida 1 daqiqa').max(600),
  isPreview: z.boolean().optional(),
});

function LessonModal({ open, onClose, lesson, courseId, onSaved }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(lessonSchema),
    values: lesson
      ? { title: lesson.title, content: lesson.content || '', videoUrl: lesson.videoUrl || '', durationMinutes: lesson.durationMinutes, isPreview: lesson.isPreview }
      : { title: '', content: '', videoUrl: '', durationMinutes: 10, isPreview: false },
  });

  const onSubmit = async (values) => {
    try {
      if (lesson) await lessonsApi.update(lesson.id, values);
      else await lessonsApi.create(courseId, values);
      toast.success(lesson ? 'Dars saqlandi' : 'Dars qo\'shildi');
      onSaved();
      onClose();
    } catch (e) {
      applyServerErrors(e, setError);
      toast.error(e.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={lesson ? 'Darsni tahrirlash' : 'Yangi dars'} size="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField label="Dars nomi" {...register('title')} error={errors.title?.message} />
        <TextField label="Dars matni" as="textarea" rows={8} {...register('content')} error={errors.content?.message} />
        <div className="grid gap-x-4 sm:grid-cols-[1fr_180px]">
          <TextField label="Video havolasi (YouTube/Vimeo, ixtiyoriy)" placeholder="https://youtu.be/..." {...register('videoUrl')} error={errors.videoUrl?.message} />
          <TextField label="Davomiyligi (daqiqa)" type="number" min={1} {...register('durationMinutes')} error={errors.durationMinutes?.message} />
        </div>
        <label className="mb-5 flex items-center gap-2.5 text-sm">
          <input type="checkbox" className="size-4 accent-brand-600" {...register('isPreview')} />
          Ochiq dars (kursga yozilmaganlar ham ko'ra oladi)
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{lesson ? 'Saqlash' : 'Qo\'shish'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function CourseLessons() {
  const { id } = useParams();
  const confirm = useConfirm();
  const course = useFetch(() => coursesApi.get(id), [id]);
  const lessons = useFetch(() => lessonsApi.list(id), [id]);
  const [modal, setModal] = useState(null); // null | 'new' | lesson
  useTitle(course.data ? `${course.data.title} — darslar` : 'Darslar');

  if (course.loading || lessons.loading) return <PageLoader />;
  if (course.error?.status === 404) return <NotFound />;
  if (course.error || lessons.error) return <ErrorState error={course.error || lessons.error} onRetry={() => { course.reload(); lessons.reload(); }} />;
  if (!course.data.viewer.canManage) return <NotFound />;

  const list = lessons.data || [];

  const move = async (index, dir) => {
    const ids = list.map((l) => l.id);
    [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
    try {
      await lessonsApi.reorder(id, ids);
      lessons.reload();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (l) => {
    if (!(await confirm({ title: 'Darsni o\'chirish', message: `"${l.title}" darsi o'chiriladi.`, confirmText: 'O\'chirish', danger: true }))) return;
    try {
      await lessonsApi.remove(l.id);
      toast.success('Dars o\'chirildi');
      lessons.reload();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <Link to="/teacher/courses" className="mb-4 inline-flex items-center gap-1.5 font-medium text-muted hover:text-brand-700"><ArrowLeft className="size-4" /> Kurslarim</Link>
      <PageHeader
        title={course.data.title}
        subtitle={<span className="inline-flex items-center gap-2"><StatusBadge status={course.data.status} /> {list.length} ta dars</span>}
        actions={(
          <>
            <Link to={`/teacher/courses/${id}/students`} className="btn btn-outline"><Users /> Talabalar</Link>
            <button type="button" className="btn btn-primary" onClick={() => setModal('new')}><Plus /> Dars qo'shish</button>
          </>
        )}
      />
      {!list.length ? (
        <div className="card"><EmptyState title="Hali dars yo'q" text="Birinchi darsni qo'shing." action={<button type="button" className="btn btn-primary" onClick={() => setModal('new')}><Plus /> Dars qo'shish</button>} /></div>
      ) : (
        <ol className="card divide-y divide-line">
          {list.map((l, i) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 font-bold text-brand-700">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{l.title}</p>
                <p className="text-sm text-muted">{l.durationMinutes} daqiqa{l.isPreview && ' · ochiq dars'}{l.videoUrl && ' · video bor'}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn btn-ghost btn-sm btn-icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Yuqoriga"><ArrowUp /></button>
                <button type="button" className="btn btn-ghost btn-sm btn-icon" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Pastga"><ArrowDown /></button>
                <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(l)} aria-label="Tahrirlash"><Pencil /></button>
                <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => remove(l)} aria-label="O'chirish"><Trash2 /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 text-sm text-muted"><Eye className="mr-1 inline size-4" />Talabalar ko'rinishi: <Link className="font-semibold text-brand-700 hover:underline" to={`/courses/${course.data.slug}`}>kurs sahifasi</Link></p>
      <LessonModal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        lesson={modal && modal !== 'new' ? modal : null}
        courseId={id}
        onSaved={lessons.reload}
      />
    </div>
  );
}

export function CourseStudents() {
  const { id } = useParams();
  const course = useFetch(() => coursesApi.get(id), [id]);
  const students = useFetch(() => teacherApi.students(id), [id]);
  useTitle('Kurs talabalari');

  if (course.loading || students.loading) return <PageLoader />;
  if (course.error?.status === 404 || students.error?.status === 403) return <NotFound />;
  if (course.error || students.error) return <ErrorState error={course.error || students.error} onRetry={students.reload} />;

  const list = students.data || [];
  const avg = list.length ? Math.round(list.reduce((s, r) => s + r.progress.percent, 0) / list.length) : 0;

  return (
    <div>
      <Link to="/teacher/courses" className="mb-4 inline-flex items-center gap-1.5 font-medium text-muted hover:text-brand-700"><ArrowLeft className="size-4" /> Kurslarim</Link>
      <PageHeader title="Kurs talabalari" subtitle={`${course.data.title} · ${list.length} ta talaba · o'rtacha progress ${avg}%`} />
      {!list.length ? (
        <div className="card"><EmptyState icon={Users} title="Hali talaba yozilmagan" text="Kurs nashr qilingach talabalar yoziladi." /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-semibold">Talaba</th>
                <th className="px-4 py-3 font-semibold">Yozilgan sana</th>
                <th className="px-4 py-3 font-semibold">Darslar</th>
                <th className="w-1/3 px-4 py-3 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.enrollmentId} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3"><Avatar user={r.student} size="size-9 text-xs" /><div><p className="font-semibold">{fullName(r.student)}</p><p className="text-muted">{r.student.email}</p></div></div>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(r.enrolledAt)}</td>
                  <td className="px-4 py-3">{r.progress.completed} / {r.progress.total}</td>
                  <td className="px-4 py-3"><ProgressBar value={r.progress.percent} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Barcha kurslarim talabalari (sidebar -> "Talabalar"). Faqat o'z kurslari — backend shuni tekshiradi.
export function TeacherStudents() {
  useTitle('Talabalarim');
  const { data, loading, error, reload } = useFetch(() => teacherApi.allStudents(), []);
  const [courseId, setCourseId] = useState('');
  const list = (data || []).filter((r) => !courseId || String(r.course.id) === courseId);
  const courses = [...new Map((data || []).map((r) => [r.course.id, r.course])).values()];

  return (
    <div>
      <PageHeader title="Talabalarim" subtitle="Kurslaringizga yozilgan talabalar va ularning progressi" />
      {loading && <PageLoader />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (data.length ? (
        <>
          <label className="mb-4 block w-full sm:w-80">
            <span className="sr-only">Kurs bo'yicha filtr</span>
            <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Barcha kurslar ({data.length} ta yozilish)</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 font-semibold">Talaba</th>
                  <th className="px-4 py-3 font-semibold">Kurs</th>
                  <th className="w-1/4 px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Yozilgan sana</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.enrollmentId} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3"><Avatar user={r.student} size="size-9 text-xs" /><div><p className="font-semibold">{fullName(r.student)}</p><p className="text-muted">{r.student.email}</p></div></div>
                    </td>
                    <td className="px-4 py-3"><Link to={`/teacher/courses/${r.course.id}/students`} className="hover:text-brand-700">{r.course.title}</Link></td>
                    <td className="px-4 py-3"><ProgressBar value={r.progress.percent} /></td>
                    <td className="px-4 py-3 text-muted">{formatDate(r.enrolledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <div className="card"><EmptyState icon={Users} title="Hali talaba yo'q" text="Kursingizni nashr qilgach, talabalar yozila boshlaydi." /></div>)}
    </div>
  );
}
