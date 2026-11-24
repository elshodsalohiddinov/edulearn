import { Link } from 'react-router';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTitle } from '../../hooks/useFetch';

export default function Forbidden() {
  useTitle('Ruxsat yo\'q');
  const { homePath } = useAuth();
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-red-600"><ShieldX className="size-8" /></span>
        <p className="mt-6 text-6xl font-extrabold text-red-600">403</p>
        <h1 className="mt-2 text-2xl font-bold">Bu sahifaga ruxsatingiz yo'q</h1>
        <p className="mt-2 text-muted">Sahifa boshqa rol uchun mo'ljallangan.</p>
        <Link to={homePath} className="btn btn-primary mt-6">Mening panelimga</Link>
      </div>
    </div>
  );
}
