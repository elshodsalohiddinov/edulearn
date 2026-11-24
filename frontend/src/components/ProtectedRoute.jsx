// Himoyalangan sahifalar: kirmagan -> /login, roli mos kelmasa -> 403 sahifa.
// Eslatma: bu faqat qulaylik uchun. Haqiqiy himoya backenddagi requireRole middleware'da.
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from './ui';
import Forbidden from '../pages/public/Forbidden';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Forbidden />;
  return <Outlet />;
}

// Kirgan foydalanuvchi /login yoki /register ga kirsa — o'z paneliga
export function GuestOnly() {
  const { user, loading, homePath } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={homePath} replace />;
  return <Outlet />;
}
