// Dars sahifasi: video (bo'lsa), matn, "Tugallandi" tugmasi, oldingi/keyingi dars, darslar ro'yxati.
// Faqat kursga yozilgan talaba ochadi — server ham buni tekshiradi (yozilmaganga dars matni berilmaydi).
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { ErrorState, PageLoader, ProgressBar } from '../../components/ui';
import { coursesApi, enrollmentApi, lessonsApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';
import { cn, toEmbedUrl } from '../../utils/format';

export default function Learn() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const course = useFetch(() => coursesApi.get(courseId), [courseId]);
  const lessons = useFetch(() => lessonsApi.list(courseId), [courseId]);
  const progress = useFetch(() => enrollmentApi.progress(courseId), [courseId]);

  const list = lessons.data || [];
  const lesson = list.find((l) => String(l.id) === String(lessonId));
  useTitle(lesson?.title || 'Dars');

  if (course.loading || lessons.loading || progress.loading) return <PageLoader />;
  const err = course.error || lessons.error;
  if (err) return <ErrorState error={err} onRetry={() => { course.reload(); lessons.reload(); }} />;
  // Kursga yozilmagan bo'lsa — kurs sahifasiga (u yerda "Yozilish" tugmasi bor)
  if (progress.error?.status === 403 || !lessons.meta?.hasAccess) return <Navigate to={`/courses/${course.data.slug}`} replace />;
  if (!lesson) {
    if (list.length) return <Navigate to={`/student/learn/${courseId}/${list[0].id}`} replace />;
    return <ErrorState error={{ message: 'Bu kursda hali darslar yo\'q' }} />;
  }

  const done = new Set(progress.data?.completedLessonIds || []);
  const idx = list.indexOf(lesson);
  const prev = list[idx - 1];
  const next = list[idx + 1];
  const isDone = done.has(lesson.id);
  const embed = toEmbedUrl(lesson.videoUrl);

  const toggle = async () => {
    setSaving(true);
    try {
      const p = await enrollmentApi.setLesson(lesson.id, !isDone);
      progress.setData(p);
      if (!isDone) {
        toast.success(p.isCompleted ? 'Tabriklaymiz! Kursni to\'liq yakunladingiz 🎉' : 'Dars tugatildi');
        if (next && !p.isCompleted) navigate(`/student/learn/${courseId}/${next.id}`);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link to="/student/my-courses" className="mb-4 inline-flex items-center gap-1.5 font-medium text-muted hover:text-brand-700"><ArrowLeft className="size-4" /> Mening kurslarim</Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to={`/courses/${course.data.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">{course.data.title}</Link>
          <h1 className="text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
        </div>
        <div className="w-full max-w-xs">
          <ProgressBar value={progress.data?.percent || 0} />
          <p className="mt-1 text-right text-xs text-muted">{progress.data?.completed} / {progress.data?.total} dars</p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <article className="card p-5 sm:p-7">
          {embed ? (
            <div className="mb-6 aspect-video overflow-hidden rounded-xl bg-ink">
              <iframe className="size-full" src={embed} title={lesson.title} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
            </div>
          ) : lesson.videoUrl ? (
            <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-soft mb-6"><PlayCircle /> Videoni ochish</a>
          ) : null}
          <span className="badge bg-brand-50 text-brand-700">{idx + 1}-dars · {lesson.durationMinutes} daqiqa</span>
          {/* Matn oddiy matn sifatida chiqariladi (HTML sifatida emas) — XSS xavfi yo'q */}
          <div className="mt-4 whitespace-pre-line text-[16px] leading-7 text-ink/85">{lesson.content}</div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            <button type="button" className="btn btn-outline" disabled={!prev} onClick={() => navigate(`/student/learn/${courseId}/${prev.id}`)}><ArrowLeft /> Oldingi</button>
            <button type="button" className={cn('btn', isDone ? 'btn-soft' : 'btn-primary')} onClick={toggle} disabled={saving}>
              {isDone ? <><CheckCircle2 /> Tugatilgan (bekor qilish)</> : <><Check /> Tugallandi</>}
            </button>
            <button type="button" className="btn btn-outline" disabled={!next} onClick={() => navigate(`/student/learn/${courseId}/${next.id}`)}>Keyingi <ArrowRight /></button>
          </div>
        </article>

        <aside className="card p-2 xl:sticky xl:top-6">
          <h2 className="px-3 pb-2 pt-3 font-bold">Kurs darslari</h2>
          <ol className="max-h-[65vh] overflow-y-auto">
            {list.map((l, i) => (
              <li key={l.id}>
                <Link
                  to={`/student/learn/${courseId}/${l.id}`}
                  aria-current={l.id === lesson.id ? 'page' : undefined}
                  className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5', l.id === lesson.id ? 'bg-brand-50' : 'hover:bg-canvas')}
                >
                  <span className={cn('grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold', done.has(l.id) ? 'bg-emerald-500 text-white' : 'bg-canvas')}>
                    {done.has(l.id) ? <Check className="size-3.5" aria-label="Tugatilgan" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">{l.title}</span>
                  {l.locked && <Lock className="size-4 text-muted" />}
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
