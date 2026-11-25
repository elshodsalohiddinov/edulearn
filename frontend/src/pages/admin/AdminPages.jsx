// Super admin: foydalanuvchilar (rol, bloklash), kurslar (tasdiqlash/yashirish), kategoriyalar CRUD, xabarlar.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { Ban, Check, CheckCircle2, Eye, EyeOff, FolderTree, Mail, Pencil, Plus, Rocket, Search, Trash2, UserCheck, Users, X } from 'lucide-react';
import { Modal, useConfirm } from '../../components/Modal';
import { TextField } from '../../components/FormField';
import { CourseThumb } from '../../components/CourseCard';
import { Avatar, EmptyState, ErrorState, PageHeader, Pagination, RoleBadge, SkeletonGrid, StatusBadge } from '../../components/ui';
import { adminApi, categoriesApi, coursesApi, teacherRequestsApi } from '../../services/coursesApi';
import { useDebounce, useFetch, useTitle } from '../../hooks/useFetch';
import { useAuth } from '../../contexts/AuthContext';
import { STATUSES, formatDate, fullName } from '../../utils/format';

function SearchInput({ value, onChange, placeholder }) {
  return (
    <label className="relative w-full sm:w-72">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input type="search" className="input pl-11" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

// ======================= Foydalanuvchilar =======================
export function AdminUsers() {
  useTitle('Foydalanuvchilar');
  const { user: me } = useAuth();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim());
  const { data, meta, loading, error, reload } = useFetch(() => adminApi.users({ search: q || undefined, role: role || undefined, status: status || undefined, page, limit: 10 }), [q, role, status, page]);

  const changeRole = async (u, newRole) => {
    const ok = await confirm({
      title: 'Rolni o\'zgartirish',
      message: `${fullName(u)} ${newRole === 'TEACHER' ? 'o\'qituvchi qilib tayinlansinmi? U kurs yarata oladi.' : 'yana talaba bo\'lsinmi?'}`,
      confirmText: 'Tasdiqlash',
    });
    if (!ok) return;
    try { await adminApi.setRole(u.id, newRole); toast.success('Rol o\'zgartirildi'); reload(); } catch (e) { toast.error(e.message); }
  };

  const toggleActive = async (u) => {
    const ok = await confirm({
      title: u.isActive ? 'Bloklash' : 'Blokdan chiqarish',
      message: u.isActive ? `${fullName(u)} tizimga kira olmaydi.` : `${fullName(u)} yana tizimga kira oladi.`,
      confirmText: u.isActive ? 'Bloklash' : 'Ochish',
      danger: u.isActive,
    });
    if (!ok) return;
    try { await adminApi.setStatus(u.id, !u.isActive); toast.success('Holat o\'zgartirildi'); reload(); } catch (e) { toast.error(e.message); }
  };

  const filter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <div>
      <PageHeader title="Foydalanuvchilar" subtitle={meta ? `Jami: ${meta.total}` : undefined} />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Ism yoki email..." />
        <select className="input w-auto" value={role} onChange={filter(setRole)} aria-label="Rol bo'yicha filtr">
          <option value="">Barcha rollar</option>
          <option value="STUDENT">Talabalar</option>
          <option value="TEACHER">O'qituvchilar</option>
          <option value="SUPER_ADMIN">Adminlar</option>
        </select>
        <select className="input w-auto" value={status} onChange={filter(setStatus)} aria-label="Holat bo'yicha filtr">
          <option value="">Barcha holatlar</option>
          <option value="active">Faol</option>
          <option value="blocked">Bloklangan</option>
        </select>
      </div>
      {loading && <SkeletonGrid count={1} className="h-96" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (data.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Faollik</th>
                <th className="px-4 py-3 font-semibold">Ro'yxatdan o'tgan</th>
                <th className="px-4 py-3 text-right font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => {
                const locked = u.id === me.id || u.role === 'SUPER_ADMIN';
                return (
                  <tr key={u.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} size="size-9 text-xs" />
                        <div>
                          <p className="font-semibold">{fullName(u)} {!u.isActive && <span className="badge ml-1 bg-red-50 text-red-600">Bloklangan</span>}</p>
                          <p className="text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 text-muted">{u.role === 'TEACHER' ? `${u._count.courses} kurs` : u.role === 'STUDENT' ? `${u._count.enrollments} ta yozilish` : '—'}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {locked ? <p className="text-right text-xs text-muted">O'zgartirib bo'lmaydi</p> : (
                        <div className="flex justify-end gap-2">
                          {u.role === 'STUDENT'
                            ? <button type="button" className="btn btn-soft btn-sm" onClick={() => changeRole(u, 'TEACHER')}>O'qituvchi qilish</button>
                            : <button type="button" className="btn btn-outline btn-sm" onClick={() => changeRole(u, 'STUDENT')}>Talaba qilish</button>}
                          <button type="button" className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-outline'}`} onClick={() => toggleActive(u)}>
                            {u.isActive ? <><Ban /> Bloklash</> : <><CheckCircle2 /> Ochish</>}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="card"><EmptyState icon={Users} title="Foydalanuvchi topilmadi" /></div>)}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

// ======================= Kurslar =======================
export function AdminCourses() {
  useTitle('Kurslar nazorati');
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const status = params.get('status') || '';
  const q = useDebounce(search.trim());
  const { data, meta, loading, error, reload } = useFetch(() => adminApi.courses({ search: q || undefined, status: status || undefined, page, limit: 10 }), [q, status, page]);

  const setCourseStatus = async (c, s) => {
    try { await adminApi.setCourseStatus(c.id, s); toast.success(`Holat: ${STATUSES[s].label}`); reload(); } catch (e) { toast.error(e.message); }
  };
  const remove = async (c) => {
    if (!(await confirm({ title: 'Kursni o\'chirish', message: `"${c.title}" va uning barcha darslari, yozilishlari o'chiriladi.`, confirmText: 'O\'chirish', danger: true }))) return;
    try { await coursesApi.remove(c.id); toast.success('Kurs o\'chirildi'); reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader title="Barcha kurslar" subtitle="Nojo'ya yoki keraksiz kursni yashiring; yashirilgan kurs katalogda ko'rinmaydi." />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Kurs nomi..." />
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Holat">
          {[['', 'Barchasi'], ...['PUBLISHED', 'DRAFT', 'ARCHIVED'].map((k) => [k, STATUSES[k].label])].map(([k, label]) => (
            <button
              key={k || 'all'}
              type="button"
              role="tab"
              aria-selected={status === k}
              className={`btn btn-sm ${status === k ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setParams(k ? { status: k } : {}); setPage(1); }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {loading && <SkeletonGrid count={3} className="h-24" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (data.length ? (
        <div className="grid gap-3">
          {data.map((c) => (
            <div key={c.id} className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
              <CourseThumb course={c} className="h-24 rounded-xl lg:h-16 lg:w-24 lg:shrink-0" iconSize="size-9" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={c.status} /><span className="text-xs text-muted">{c.category.name}</span></div>
                <h3 className="mt-1 truncate font-bold">{c.title}</h3>
                <p className="text-sm text-muted">{fullName(c.teacher)} · {c.lessonCount} dars · {c.studentCount} talaba · {formatDate(c.updatedAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.status === 'ARCHIVED' && <button type="button" className="btn btn-primary btn-sm" onClick={() => setCourseStatus(c, 'PUBLISHED')}><Rocket /> Qayta nashr qilish</button>}
                {c.status !== 'ARCHIVED' && <button type="button" className="btn btn-outline btn-sm" onClick={() => setCourseStatus(c, 'ARCHIVED')}><EyeOff /> Yashirish</button>}
                <Link to={`/courses/${c.slug}`} className="btn btn-ghost btn-sm btn-icon" aria-label="Ko'rish"><Eye /></Link>
                <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => remove(c)} aria-label="O'chirish"><Trash2 /></button>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="card"><EmptyState title="Kurs topilmadi" /></div>)}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

// ======================= Kategoriyalar (CRUD) =======================
export function AdminCategories() {
  useTitle('Kategoriyalar');
  const confirm = useConfirm();
  const { data, loading, error, reload } = useFetch(() => categoriesApi.list(), []);
  const [editing, setEditing] = useState(null); // null | {} (yangi) | category
  const [name, setName] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [saving, setSaving] = useState(false);

  const open = (c) => { setEditing(c || {}); setName(c?.name || ''); setFieldError(''); };
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing.id) await categoriesApi.update(editing.id, { name });
      else await categoriesApi.create({ name });
      toast.success('Saqlandi');
      setEditing(null);
      reload();
    } catch (err) {
      setFieldError(err.errors?.[0]?.message || err.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (c) => {
    if (!(await confirm({ title: 'Kategoriyani o\'chirish', message: `"${c.name}" o'chirilsinmi?`, confirmText: 'O\'chirish', danger: true }))) return;
    try { await categoriesApi.remove(c.id); toast.success('O\'chirildi'); reload(); } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Kategoriyalar" subtitle="Kurslar yo'nalishlari" actions={<button type="button" className="btn btn-primary" onClick={() => open()}><Plus /> Yangi kategoriya</button>} />
      {loading && <SkeletonGrid count={1} className="h-64" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (data.length ? (
        <ul className="card divide-y divide-line">
          {data.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><FolderTree className="size-5" /></span>
              <div className="flex-1"><p className="font-semibold">{c.name}</p><p className="text-sm text-muted">/{c.slug} · {c.courseCount} ta nashr qilingan kurs</p></div>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => open(c)} aria-label="Tahrirlash"><Pencil /></button>
              <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => remove(c)} aria-label="O'chirish"><Trash2 /></button>
            </li>
          ))}
        </ul>
      ) : <div className="card"><EmptyState icon={FolderTree} title="Kategoriyalar yo'q" /></div>)}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'} size="max-w-md">
        <form onSubmit={save} noValidate>
          <TextField label="Nomi" value={name} onChange={(e) => setName(e.target.value)} error={fieldError} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>Saqlash</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ======================= Xabarlar =======================
export function AdminMessages() {
  useTitle('Xabarlar');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload, setData } = useFetch(() => adminApi.messages({ page, limit: 10 }), [page]);
  const markRead = async (m) => {
    try {
      await adminApi.markRead(m.id);
      setData((list) => list.map((x) => (x.id === m.id ? { ...x, isRead: true } : x)));
    } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="max-w-4xl">
      <PageHeader title="Xabarlar" subtitle="Bog'lanish formasi orqali kelgan murojaatlar" />
      {loading && <SkeletonGrid count={2} className="h-28" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (data.length ? (
        <div className="grid gap-3">
          {data.map((m) => (
            <article key={m.id} className={`card p-5 ${m.isRead ? '' : 'border-brand-300'}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{m.subject || 'Mavzusiz'} {!m.isRead && <span className="badge ml-1 bg-brand-50 text-brand-700">Yangi</span>}</p>
                  <p className="text-sm text-muted">{m.name} · <a href={`mailto:${m.email}`} className="hover:text-brand-700">{m.email}</a> · {formatDate(m.createdAt)}</p>
                </div>
                {!m.isRead && <button type="button" className="btn btn-outline btn-sm" onClick={() => markRead(m)}><Check /> O'qildi</button>}
              </div>
              <p className="mt-3 whitespace-pre-line text-ink/85">{m.message}</p>
            </article>
          ))}
        </div>
      ) : <div className="card"><EmptyState icon={Mail} title="Xabarlar yo'q" /></div>)}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

// ======================= O'qituvchi so'rovlari =======================
const REQUEST_TABS = [['PENDING', 'Kutilmoqda'], ['APPROVED', 'Qabul qilingan'], ['REJECTED', 'Rad etilgan']];

export function AdminTeacherRequests() {
  useTitle('O\'qituvchi so\'rovlari');
  const confirm = useConfirm();
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => teacherRequestsApi.list({ status, page, limit: 10 }), [status, page]);

  const decide = async (r, decision) => {
    const approve = decision === 'APPROVED';
    const ok = await confirm({
      title: approve ? 'Arizani qabul qilish' : 'Arizani rad etish',
      message: approve
        ? `${fullName(r.user)} o'qituvchi bo'ladi va kurs yarata oladi.`
        : `${fullName(r.user)} talaba bo'lib qoladi. U keyinroq qayta ariza yuborishi mumkin.`,
      confirmText: approve ? 'Qabul qilish' : 'Rad etish',
      danger: !approve,
    });
    if (!ok) return;
    try {
      await teacherRequestsApi.decide(r.id, decision);
      toast.success(approve ? 'Qabul qilindi — foydalanuvchi endi o\'qituvchi' : 'Ariza rad etildi');
      reload();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="O'qituvchi so'rovlari" subtitle="Talabalar o'qituvchi bo'lish uchun yuborgan arizalar" />
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Ariza holati">
        {REQUEST_TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={status === k} className={`btn btn-sm ${status === k ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setStatus(k); setPage(1); }}>
            {label}
          </button>
        ))}
      </div>
      {loading && <SkeletonGrid count={2} className="h-40" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (data.length ? (
        <div className="grid gap-3">
          {data.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar user={r.user} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{fullName(r.user)} <RoleBadge role={r.user.role} /></p>
                  <p className="text-sm text-muted">{r.user.email} · {formatDate(r.createdAt)}</p>
                </div>
                {r.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => decide(r, 'APPROVED')}><Check /> Qabul qilish</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => decide(r, 'REJECTED')}><X /> Rad etish</button>
                  </div>
                ) : (
                  <span className={`badge ${r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {r.status === 'APPROVED' ? 'Qabul qilingan' : 'Rad etilgan'} · {formatDate(r.reviewedAt)}
                  </span>
                )}
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold text-muted">Mutaxassislik</dt>
                <dd>{r.expertise}</dd>
                <dt className="text-sm font-semibold text-muted">Tajriba</dt>
                <dd className="whitespace-pre-line text-ink/85">{r.experience}</dd>
              </dl>
            </article>
          ))}
        </div>
      ) : <div className="card"><EmptyState icon={UserCheck} title="Ariza yo'q" text="Bu holatda hech qanday ariza topilmadi." /></div>)}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
