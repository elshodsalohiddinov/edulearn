import { Link } from 'react-router';
import { Compass, Home } from 'lucide-react';
import { useTitle } from '../../hooks/useFetch';

export default function NotFound() {
  useTitle('Sahifa topilmadi');
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Compass className="size-8" /></span>
        <p className="mt-6 text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-bold">Sahifa topilmadi</h1>
        <p className="mt-2 text-muted">Siz qidirgan sahifa mavjud emas yoki o'chirilgan.</p>
        <Link to="/" className="btn btn-primary mt-6"><Home /> Bosh sahifaga</Link>
      </div>
    </div>
  );
}
