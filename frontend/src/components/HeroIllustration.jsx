// Bosh sahifadagi illyustratsiya: noutbuk ortida o'qiyotgan talaba (inline SVG — tashqi rasm kerak emas).
// Ustidagi kichik kartalar oddiy HTML, shuning uchun matnlari o'zbekcha va ekran o'qish dasturlariga yashirin.
import { Award, BarChart3, Code2 } from 'lucide-react';

export default function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[540px]" aria-hidden="true">
      <svg viewBox="0 0 540 440" className="h-auto w-full" role="presentation">
        <defs>
          <linearGradient id="hero-blob" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#cbc1fd" />
            <stop offset="0.55" stopColor="#8a6af8" />
            <stop offset="1" stopColor="#6236f5" />
          </linearGradient>
          <linearGradient id="hero-sweater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#7c5cf0" />
          </linearGradient>
        </defs>

        {/* fon */}
        <path d="M95 120C140 40 280 10 380 55s150 140 120 230-120 140-230 135S60 380 45 290 50 200 95 120Z" fill="url(#hero-blob)" />
        <circle cx="440" cy="90" r="10" fill="#fff" opacity=".5" />
        <circle cx="70" cy="330" r="7" fill="#fff" opacity=".45" />

        {/* o'simlik */}
        <rect x="402" y="262" width="44" height="46" rx="8" fill="#f1eeff" />
        <path d="M424 262c-4-30-26-44-40-46 6 18 18 34 40 46Z" fill="#34d399" />
        <path d="M424 262c2-34 22-52 38-56-4 22-16 42-38 56Z" fill="#10b981" />
        <path d="M424 262c-2-24 4-44 12-56 6 20 2 40-12 56Z" fill="#059669" />

        {/* talaba */}
        <path d="M188 318c0-58 36-96 82-96s82 38 82 96Z" fill="url(#hero-sweater)" />
        <path d="M252 222h36v18c0 10-8 16-18 16s-18-6-18-16Z" fill="#e8b48f" />
        <ellipse cx="270" cy="176" rx="44" ry="48" fill="#f2c9a5" />
        {/* soch */}
        <path d="M226 172c-4-40 20-66 48-66 30 0 50 24 44 64-8-18-22-30-44-32-18-2-36 12-48 34Z" fill="#2b2040" />
        <circle cx="300" cy="116" r="20" fill="#2b2040" />
        {/* naushnik */}
        <path d="M222 178c0-40 22-66 48-66s48 26 48 66" fill="none" stroke="#1e1b4b" strokeWidth="7" strokeLinecap="round" />
        <rect x="212" y="166" width="18" height="32" rx="8" fill="#1e1b4b" />
        <rect x="310" y="166" width="18" height="32" rx="8" fill="#1e1b4b" />
        {/* yuz */}
        <circle cx="255" cy="180" r="3.6" fill="#2b2040" />
        <circle cx="286" cy="180" r="3.6" fill="#2b2040" />
        <path d="M258 198c6 6 18 6 24 0" fill="none" stroke="#b4553d" strokeWidth="3" strokeLinecap="round" />
        <circle cx="248" cy="193" r="5" fill="#f9a8a8" opacity=".6" />
        <circle cx="293" cy="193" r="5" fill="#f9a8a8" opacity=".6" />

        {/* stol */}
        <rect x="90" y="306" width="372" height="16" rx="8" fill="#e2defe" />
        <rect x="120" y="322" width="12" height="70" rx="6" fill="#cbc1fd" />
        <rect x="420" y="322" width="12" height="70" rx="6" fill="#cbc1fd" />

        {/* noutbuk (orqa tomoni) */}
        <path d="M196 236h148a10 10 0 0 1 10 10v58H186v-58a10 10 0 0 1 10-10Z" fill="#e5e7eb" />
        <path d="M196 236h148a10 10 0 0 1 10 10v58H186v-58a10 10 0 0 1 10-10Z" fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M270 258l20 10-20 10-20-10Z" fill="#6236f5" />
        <path d="M258 272v8c6 5 18 5 24 0v-8" fill="none" stroke="#6236f5" strokeWidth="3" strokeLinecap="round" />
        <rect x="170" y="300" width="200" height="10" rx="5" fill="#cbd5e1" />

        {/* qo'llar */}
        <ellipse cx="196" cy="298" rx="18" ry="11" fill="#f2c9a5" />
        <ellipse cx="344" cy="298" rx="18" ry="11" fill="#f2c9a5" />

        {/* kitoblar va krujka */}
        <rect x="108" y="282" width="62" height="12" rx="3" fill="#f472b6" />
        <rect x="114" y="270" width="56" height="12" rx="3" fill="#38bdf8" />
        <rect x="104" y="294" width="70" height="12" rx="3" fill="#6236f5" />
        <rect x="378" y="276" width="26" height="30" rx="6" fill="#fff" />
        <path d="M404 284c10 0 10 14 0 14" fill="none" stroke="#fff" strokeWidth="4" />
        <path d="M386 266c-4-6 4-8 0-14M396 266c-4-6 4-8 0-14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".8" />
      </svg>

      {[
        ['left-0 top-[8%]', Code2, 'Dasturlash', 'amaliy darslar', 'bg-brand-50 text-brand-600'],
        ['right-0 top-[20%]', BarChart3, 'Progress', 'har bir dars', 'bg-pink-50 text-pink-600'],
        ['bottom-[6%] left-[2%]', Award, 'Yakunlash', 'kurs oxirida', 'bg-emerald-50 text-emerald-600'],
      ].map(([pos, Icon, t, s, c]) => (
        <div key={t} className={`absolute ${pos} hidden items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-pop sm:flex`}>
          <span className={`grid size-9 place-items-center rounded-xl ${c}`}><Icon className="size-5" /></span>
          <span className="text-sm font-semibold leading-tight">{t}<span className="block text-xs font-normal text-muted">{s}</span></span>
        </div>
      ))}
    </div>
  );
}
