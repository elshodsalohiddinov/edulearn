// Kurslar katalogi: qidiruv, kategoriya, daraja, saralash, sahifalash.
// Filtrlar URL'da saqlanadi (?search=react&page=2) — havolani ulashsa ham shu natija ochiladi.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search, SearchX } from 'lucide-react';
import CourseCard from './CourseCard';
import { EmptyState, ErrorState, Pagination, SkeletonGrid } from './ui';
import { coursesApi, categoriesApi } from '../services/coursesApi';
import { useDebounce, useFetch } from '../hooks/useFetch';
import { LEVELS, cn } from '../utils/format';

export default function CourseCatalog() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const debounced = useDebounce(search.trim());

  const query = {
    search: params.get('search') || undefined,
    category: params.get('category') || undefined,
    level: params.get('level') || undefined,
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page')) || 1,
    limit: 9,
  };

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  // Yozish to'xtagach 350ms dan keyin qidiradi (har harfda so'rov yubormaslik uchun)
  useEffect(() => {
    if (debounced !== (params.get('search') || '')) update({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const cats = useFetch(() => categoriesApi.list(), []);
  const courses = useFetch(() => coursesApi.list(query), [params.toString()]);

  return (
    <div>
      <form className="card grid gap-3 p-4 md:grid-cols-[1fr_180px_180px] lg:p-5" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="relative">
          <span className="sr-only">Kurslarni qidirish</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            className="input pl-11"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kurs nomi, mavzu yoki o'qituvchi..."
          />
        </label>
        <label>
          <span className="sr-only">Daraja</span>
          <select className="input" value={query.level || ''} onChange={(e) => update({ level: e.target.value })}>
            <option value="">Barcha darajalar</option>
            {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Saralash</span>
          <select className="input" value={query.sort} onChange={(e) => update({ sort: e.target.value })}>
            <option value="newest">Eng yangilari</option>
            <option value="popular">Eng ommaboplari</option>
            <option value="title">Nomi bo'yicha (A-Z)</option>
            <option value="oldest">Eng eskilari</option>
          </select>
        </label>
      </form>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Kategoriyalar">
        {[{ slug: '', name: 'Barchasi' }, ...(cats.data || [])].map((c) => {
          const active = (query.category || '') === c.slug;
          return (
            <button
              key={c.slug || 'all'}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => update({ category: c.slug })}
              className={cn('shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition', active ? 'bg-brand-600 text-white' : 'bg-white text-ink/80 ring-1 ring-line hover:text-brand-700')}
            >
              {c.name}{c.courseCount !== undefined && <span className="ml-1.5 opacity-70">{c.courseCount}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {courses.loading && <SkeletonGrid />}
        {!courses.loading && courses.error && <ErrorState error={courses.error} onRetry={courses.reload} />}
        {!courses.loading && !courses.error && (
          <>
            <p className="mb-4 text-sm text-muted" aria-live="polite">{courses.meta?.total ?? 0} ta kurs topildi</p>
            {courses.data?.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.data.map((c) => <CourseCard key={c.id} course={c} />)}
              </div>
            ) : (
              <div className="card">
                <EmptyState
                  icon={SearchX}
                  title="Kurs topilmadi"
                  text="Boshqa so'z bilan qidirib ko'ring yoki filtrlarni tozalang."
                  action={<button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setParams({}); }}>Filtrlarni tozalash</button>}
                />
              </div>
            )}
            <Pagination meta={courses.meta} onPage={(p) => { update({ page: String(p) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </>
        )}
      </div>
    </div>
  );
}
