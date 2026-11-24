// Kurs kartasi va muqovasi (rasm bo'lmasa — kategoriya rangidagi gradient va ikon)
import { useState } from 'react';
import { Link } from 'react-router';
import { BookOpen, CheckCircle2, PlayCircle, Signal, Users } from 'lucide-react';
import { LEVELS, categoryStyle, cn, fullName } from '../utils/format';
import { Avatar } from './ui';

// Muqova: rasm bo'lsa 16:9 kesib ko'rsatiladi, bo'lmasa yoki yuklanmasa — kategoriya rangidagi zaxira muqova
export function CourseThumb({ course, className = 'h-40', iconSize = 'size-16' }) {
  const [broken, setBroken] = useState(false);
  const style = categoryStyle(course?.category?.slug);
  const Icon = style.icon;
  if (course?.thumbnailUrl && !broken) {
    return <img src={course.thumbnailUrl} alt="" loading="lazy" onError={() => setBroken(true)} className={cn('w-full object-cover', className)} />;
  }
  return (
    <div className={cn('relative grid place-items-center overflow-hidden bg-gradient-to-br', style.gradient, className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgb(255_255_255/0.28),transparent_55%)]" />
      <span className={cn('relative grid place-items-center rounded-2xl bg-white/95 shadow-lg', iconSize, style.tint)}>
        <Icon className="size-1/2" />
      </span>
    </div>
  );
}

export default function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-pop focus-visible:-translate-y-1"
    >
      <div className="relative">
        <CourseThumb course={course} className="aspect-video" />
        <span className="badge absolute left-3 top-3 bg-emerald-50 text-emerald-700">Bepul</span>
        <span className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-full bg-white/90 text-ink">
          <PlayCircle className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">{course.category?.name}</p>
          <h3 className="line-clamp-2 text-[17px] font-bold leading-snug group-hover:text-brand-700">{course.title}</h3>
          <p className="mt-1.5 line-clamp-2 min-h-10 text-sm text-muted">{course.shortDescription}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Avatar user={course.teacher} size="size-7 text-[11px]" />
          <span className="truncate">{fullName(course.teacher)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4" aria-hidden="true" />{course.lessonCount} dars</span>
          <span className="inline-flex items-center gap-1.5"><Signal className="size-4" aria-hidden="true" />{LEVELS[course.level]}</span>
          <span className="inline-flex items-center gap-1.5"><Users className="size-4" aria-hidden="true" />{course.studentCount}</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          {course.isEnrolled ? (
            <span className="badge bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-3.5" /> Yozilgansiz</span>
          ) : <span />}
          <span className="btn btn-soft btn-sm">Batafsil</span>
        </div>
      </div>
    </Link>
  );
}
