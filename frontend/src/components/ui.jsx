// Kichik qayta ishlatiladigan UI bo'laklari: holatlar, badge, progress, avatar, sahifalash va h.k.
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, RotateCcw } from 'lucide-react';
import { LEVELS, ROLES, STATUSES, cn, initials } from '../utils/format';

export function Spinner({ className = 'size-5' }) {
  return <Loader2 className={cn('animate-spin text-brand-600', className)} aria-hidden="true" />;
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
      <Spinner className="size-8" />
      <span className="sr-only">Yuklanmoqda...</span>
    </div>
  );
}

export function SkeletonGrid({ count = 6, className = 'h-72' }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Yuklanmoqda">
      {Array.from({ length: count }, (_, i) => <div key={i} className={cn('skeleton', className)} />)}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-md text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center" role="alert">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold">Ma'lumotni yuklab bo'lmadi</h3>
      <p className="mt-1 text-muted">{error?.message || 'Noma\'lum xato'}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline mt-5" onClick={onRetry}>
          <RotateCcw /> Qayta urinish
        </button>
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = STATUSES[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={cn('badge', s.cls)}>{s.label}</span>;
}

export function LevelBadge({ level }) {
  return <span className="badge bg-brand-50 text-brand-700">{LEVELS[level] || level}</span>;
}

export function RoleBadge({ role }) {
  const cls = role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-600' : role === 'TEACHER' ? 'bg-sky-50 text-sky-700' : 'bg-brand-50 text-brand-700';
  return <span className={cn('badge', cls)}>{ROLES[role] || role}</span>;
}

export function ProgressBar({ value = 0, showLabel = true, size = 'md' }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn('flex-1 overflow-hidden rounded-full bg-brand-50', size === 'sm' ? 'h-1.5' : 'h-2')}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500" style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-10 text-right text-sm font-semibold tabular-nums">{v}%</span>}
    </div>
  );
}

const AVATAR_COLORS = ['bg-brand-600', 'bg-pink-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500'];
export function Avatar({ user, size = 'size-10 text-sm' }) {
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className={cn('shrink-0 rounded-full object-cover', size)} />;
  }
  const sum = [...`${user?.firstName}${user?.lastName}`].reduce((s, c) => s + c.charCodeAt(0), 0);
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full font-bold text-white', AVATAR_COLORS[sum % AVATAR_COLORS.length], size)} aria-hidden="true">
      {initials(user)}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-sky-50 text-sky-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className={cn('flex items-center gap-4 rounded-2xl p-5', tones[tone])}>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/80">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-ink/80">{label}</p>
        <p className="text-2xl font-bold text-ink tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages } = meta;
  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Sahifalar">
      <button type="button" className="btn btn-outline btn-sm btn-icon" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Oldingi sahifa">
        <ChevronLeft />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={cn('btn btn-sm min-w-9 px-2', p === page ? 'btn-primary' : 'btn-outline')}
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onPage(p)}
        >
          {p}
        </button>
      ))}
      <button type="button" className="btn btn-outline btn-sm btn-icon" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Keyingi sahifa">
        <ChevronRight />
      </button>
    </nav>
  );
}
