import CourseCatalog from '../../components/CourseCatalog';
import { useTitle } from '../../hooks/useFetch';

export default function Courses() {
  useTitle('Kurslar');
  return (
    <div className="container-page pt-10">
      <h1 className="text-3xl font-bold">Kurslar katalogi</h1>
      <p className="mb-6 mt-1 text-muted">Barcha kurslar bepul. Yoqqanini tanlang va o'qishni boshlang.</p>
      <CourseCatalog />
    </div>
  );
}
