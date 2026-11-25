// Kurs sahifasi: tavsif, o'qituvchi, darslar ro'yxati (syllabus), yozilish / davom ettirish.
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
  BookOpen, CheckCircle2, Clock, Eye, Lock, LogIn, PlayCircle, Settings, Signal, Users,
} from 'lucide-react';
import { CourseThumb } from '../../components/CourseCard';
import { Modal, useConfirm } from '../../components/Modal';
import { Avatar, Breadcrumbs, ErrorState, PageLoader, ProgressBar, StatusBadge } from '../../components/ui';
import { coursesApi, enrollmentApi, lessonsApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';
import { useAuth } from '../../contexts/AuthContext';
import { LEVELS, fullName, minutesLabel } from '../../utils/format';
import NotFound from './NotFound';

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const course = useFetch(() => coursesApi.get(slug), [slug, user?.id]);
  const lessons = useFetch(() => (course.data ? lessonsApi.list(course.data.id) : Promise.resolve({ data: [], meta: null })), [course.data?.id, course.data?.viewer?.isEnrolled]);
  useTitle(course.data?.title || 'Kurs');

  if (course.loading) return <PageLoader />;
  if (course.error?.status === 404) return <NotFound />;
  if (course.error) return <div className="container-page pt-10"><ErrorState error={course.error} onRetry={course.reload} /></div>;

  const c = course.data;
  const { viewer } = c;
  const learnUrl = (lessonId) => `/student/learn/${c.id}/${lessonId || viewer.progress?.nextLessonId || c.lessons[0]?.id}`;

  const enroll = async () => {
    setBusy(true);
    try {
      await enrollmentApi.enroll(c.id);
      toast.success('Kursga muvaffaqiyatli yozildingiz!');
      if (c.lessons.length) navigate(learnUrl(c.lessons[0].id));
      else course.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const unenroll = async () => {
    const ok = await confirm({ title: 'Kursdan chiqish', message: 'Kursdan chiqsangiz, shu kursdagi progressingiz o\'chadi. Davom etasizmi?', confirmText: 'Chiqish', danger: true });
    if (!ok) return;
    try {
      await enrollmentApi.unenroll(c.id);
      toast.success('Kursdan chiqdingiz');
      course.reload();
    } catch (e) { toast.error(e.message); }
  };

  const manageUrl = user?.role === 'SUPER_ADMIN' ? '/admin/courses' : `/teacher/courses/${c.id}/lessons`;

  let action;
  if (viewer.canManage) {
    action = <Link to={manageUrl} className="btn btn-primary btn-lg"><Settings /> Kursni boshqarish</Link>;
  } else if (viewer.isEnrolled) {
    action = (
      <div className="w-full max-w-md space-y-3">
        <ProgressBar value={viewer.progress.percent} />
        <p className="text-sm text-muted">{viewer.progress.completed} / {viewer.progress.total} dars tugatildi</p>
        <div className="flex flex-wrap gap-2">
          {c.lessons.length > 0 && <Link to={learnUrl()} className="btn btn-primary"><PlayCircle /> {viewer.progress.completed ? 'Davom ettirish' : 'O\'qishni boshlash'}</Link>}
          <button type="button" className="btn btn-outline" onClick={unenroll}>Kursdan chiqish</button>
        </div>
      </div>
    );
  } else if (!user) {
    action = <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary btn-lg"><LogIn /> Yozilish uchun tizimga kiring</Link>;
  } else if (viewer.canEnroll) {
    action = <button type="button" className="btn btn-primary btn-lg" onClick={enroll} disabled={busy}><CheckCircle2 /> {busy ? 'Yozilmoqda...' : 'Kursga yozilish — bepul'}</button>;
  } else {
    action = <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-muted">Kursga faqat talaba akkaunti bilan yozilish mumkin.</p>;
  }

  return (
    <div className="container-page pt-8">
      <Breadcrumbs items={[["Bosh sahifa", "/"], ["Kurslar", "/courses"], [c.category.name, `/courses?category=${c.category.slug}`], [c.title]]} />

      <section className="card grid gap-6 overflow-hidden p-5 md:grid-cols-[320px_1fr] md:p-6">
        <CourseThumb course={c} className="aspect-video rounded-xl md:self-start" iconSize="size-20" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/courses?category=${c.category.slug}`} className="badge bg-brand-50 text-brand-700 hover:bg-brand-100">{c.category.name}</Link>
            {c.status !== 'PUBLISHED' && <StatusBadge status={c.status} />}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight">{c.title}</h1>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-ink/75">{c.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink/75">
            <Link to={`/teachers/${c.teacher.id}`} className="inline-flex items-center gap-2 font-medium hover:text-brand-700">
              <Avatar user={c.teacher} size="size-7 text-[11px]" /> {fullName(c.teacher)}
            </Link>
            <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4" />{c.lessons.length} dars</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{minutesLabel(c.totalMinutes)}</span>
            <span className="inline-flex items-center gap-1.5"><Signal className="size-4" />{LEVELS[c.level]}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="size-4" />{c.studentCount} talaba</span>
            <span className="font-bold text-emerald-600">Bepul</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">{action}</div>
        </div>
      </section>

      <section className="card mt-6 p-2 sm:p-3">
        <div className="flex items-center justify-between px-3 py-3">
          <h2 className="text-xl font-bold">Kurs dasturi</h2>
          <span className="text-sm text-muted">{c.lessons.length} ta dars</span>
        </div>
        {!c.lessons.length && <p className="px-3 pb-4 text-muted">Bu kursga hali dars qo'shilmagan.</p>}
        <ol>
          {(lessons.data || c.lessons).map((l, i) => {
            const done = viewer.progress?.completedLessonIds?.includes(l.id);
            const open = viewer.isEnrolled || viewer.canManage;
            return (
              <li key={l.id} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-canvas">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-canvas'}`}>
                  {done ? <CheckCircle2 className="size-4" aria-label="Tugatilgan" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{l.title}</span>
                  <span className="text-xs text-muted">{l.durationMinutes} daqiqa</span>
                </span>
                {open && user?.role === 'STUDENT' ? (
                  <Link to={learnUrl(l.id)} className="btn btn-soft btn-sm">Ochish</Link>
                ) : l.isPreview && l.content ? (
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => setPreview(l)}><Eye /> Ko'rish</button>
                ) : !open ? (
                  <Lock className="size-4 text-muted" aria-label="Yopiq dars" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.title} size="max-w-2xl">
        <p className="whitespace-pre-line text-ink/80">{preview?.content}</p>
        {!user && <Link to="/register" className="btn btn-primary mt-6">Ro'yxatdan o'tib davom eting</Link>}
      </Modal>
    </div>
  );
}
