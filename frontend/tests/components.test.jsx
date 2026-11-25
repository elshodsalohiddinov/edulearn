// Frontend testlari: route guard, kurs kartasi, progress, video havolasi xavfsizligi.
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';
import CourseCard from '../src/components/CourseCard';
import { ProgressBar } from '../src/components/ui';
import { toEmbedUrl } from '../src/utils/format';

// AuthContext ni soxtalashtiramiz — har bir testda foydalanuvchini o'zimiz beramiz
let mockAuth = { user: null, loading: false };
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ ...mockAuth, homePath: '/' }),
  HOME_BY_ROLE: { STUDENT: '/student/dashboard', TEACHER: '/teacher/dashboard', SUPER_ADMIN: '/admin/dashboard' },
}));

// ProtectedRoute ni mock'dan keyin import qilamiz
const { default: ProtectedRoute } = await import('../src/components/ProtectedRoute');

function renderGuard(path, roles) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>LOGIN SAHIFASI</p>} />
        <Route element={<ProtectedRoute roles={roles} />}>
          <Route path="/admin/dashboard" element={<p>ADMIN PANEL</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('kirmagan foydalanuvchini /login ga yuboradi', () => {
    mockAuth = { user: null, loading: false };
    renderGuard('/admin/dashboard', ['SUPER_ADMIN']);
    expect(screen.getByText('LOGIN SAHIFASI')).toBeInTheDocument();
  });

  it('roli mos kelmasa 403 sahifasini ko\'rsatadi', () => {
    mockAuth = { user: { role: 'STUDENT', firstName: 'A', lastName: 'B' }, loading: false };
    renderGuard('/admin/dashboard', ['SUPER_ADMIN']);
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.queryByText('ADMIN PANEL')).not.toBeInTheDocument();
  });

  it('to\'g\'ri rol bilan sahifani ochadi', () => {
    mockAuth = { user: { role: 'SUPER_ADMIN', firstName: 'A', lastName: 'B' }, loading: false };
    renderGuard('/admin/dashboard', ['SUPER_ADMIN']);
    expect(screen.getByText('ADMIN PANEL')).toBeInTheDocument();
  });
});

describe('CourseCard', () => {
  const course = {
    id: 1, slug: 'react', title: 'React asoslari', description: 'Tavsif', level: 'BEGINNER',
    lessonCount: 6, studentCount: 3, category: { name: 'Dasturlash', slug: 'dasturlash' },
    teacher: { firstName: 'Sardor', lastName: 'Jo\'rayev' },
  };
  it('nom, o\'qituvchi va darslar sonini ko\'rsatadi, kurs sahifasiga havola', () => {
    render(<MemoryRouter><CourseCard course={course} /></MemoryRouter>);
    expect(screen.getByText('React asoslari')).toBeInTheDocument();
    expect(screen.getByText('Sardor Jo\'rayev')).toBeInTheDocument();
    expect(screen.getByText('6 dars')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/react');
  });
});

describe('ProgressBar', () => {
  it('foizni 0..100 oralig\'ida cheklaydi', () => {
    render(<ProgressBar value={140} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('toEmbedUrl', () => {
  it('YouTube havolasini embed ga aylantiradi', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123');
    expect(toEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123');
  });
  it('begona saytlarni iframe ga qo\'ymaydi', () => {
    expect(toEmbedUrl('https://evil.example.com/video')).toBeNull();
    expect(toEmbedUrl('javascript:alert(1)')).toBeNull();
  });
});
