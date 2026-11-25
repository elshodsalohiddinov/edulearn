import { Link } from 'react-router';

export function LogoMark({ className = 'size-10' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#6236F5" />
      <path d="M27 13 16 7.5 5 13l11 5.5L27 13Z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 15.5V21c3.5 2.7 9.5 2.7 13 0v-5.5M27 13v6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = '/', subtitle = true, light = false }) {
  return (
    <Link to={to} className="flex items-center gap-3" aria-label="EduLearn bosh sahifa">
      <LogoMark />
      <span className="leading-tight">
        <span className={`block text-xl font-extrabold ${light ? 'text-white' : 'text-ink'}`}>EduLearn</span>
        {subtitle && <span className={`block text-xs ${light ? 'text-white/75' : 'text-muted'}`}>Onlayn ta'lim platformasi</span>}
      </span>
    </Link>
  );
}
