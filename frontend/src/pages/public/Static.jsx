// "Biz haqimizda" va "Bog'lanish" sahifalari
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { BarChart3, GraduationCap, Mail, MapPin, Send, ShieldCheck, Users } from 'lucide-react';
import { TextField, applyServerErrors } from '../../components/FormField';
import { publicApi } from '../../services/coursesApi';
import { useFetch, useTitle } from '../../hooks/useFetch';

export function About() {
  useTitle('Biz haqimizda');
  const stats = useFetch(() => publicApi.stats(), []);
  return (
    <div className="container-page pt-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Biz haqimizda</h1>
        <p className="mt-4 text-lg text-ink/75">
          EduLearn — talabalar kurslarga yoziladigan, darslarni o'qiydigan va o'z progressini kuzatadigan onlayn ta'lim platformasi.
          O'qituvchilar o'z kurslarini yaratadi, administrator esa sifatni nazorat qiladi: har bir kurs nashrdan oldin tekshiriladi.
        </p>
        <p className="mt-3 text-sm text-muted">Loyiha "Web texnologiyalar" fanining semestr yakuniy jamoaviy ishi sifatida yaratilgan.</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Users, 'Talabalar', stats.data?.students],
          [GraduationCap, 'Kurslar', stats.data?.courses],
          [BarChart3, 'Yozilishlar', stats.data?.enrollments],
          [ShieldCheck, 'O\'qituvchilar', stats.data?.teachers],
        ].map(([Icon, label, n]) => (
          <div key={label} className="card p-5">
            <Icon className="size-7 text-brand-600" aria-hidden="true" />
            <p className="mt-3 text-3xl font-bold tabular-nums">{n ?? '—'}</p>
            <p className="text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          ['Talaba uchun', 'Kurslarni qidirish, bepul yozilish, darslarni o\'qish va har bir kurs bo\'yicha progressni kuzatish.'],
          ['O\'qituvchi uchun', 'Kurs yaratish, darslarni qo\'shish va tartiblash, kursga yozilgan talabalar natijalarini ko\'rish.'],
          ['Administrator uchun', 'Foydalanuvchilar va rollarni boshqarish, kurslarni tasdiqlash yoki yashirish, statistika.'],
        ].map(([t, d]) => (
          <div key={t} className="card p-6"><h2 className="text-lg font-bold">{t}</h2><p className="mt-2 text-muted">{d}</p></div>
        ))}
      </div>
    </div>
  );
}

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Ismingizni kiriting'),
  email: z.string().trim().email('Email noto\'g\'ri'),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10, 'Xabar kamida 10 ta belgidan iborat bo\'lsin').max(3000),
});

export function Contact() {
  useTitle('Bog\'lanish');
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values) => {
    try {
      await publicApi.contact(values);
      toast.success('Xabaringiz yuborildi. Rahmat!');
      reset();
    } catch (e) {
      applyServerErrors(e, setError);
      toast.error(e.message);
    }
  };

  return (
    <div className="container-page grid gap-8 pt-10 lg:grid-cols-[1fr_1.3fr]">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Bog'lanish</h1>
        <p className="mt-3 text-ink/75">Savol yoki taklifingiz bormi? Xabar qoldiring — u administrator paneliga tushadi.</p>
        <ul className="mt-6 space-y-3">
          <li className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Mail className="size-5" /></span> info@edulearn.uz</li>
          <li className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><MapPin className="size-5" /></span> Toshkent, O'zbekiston</li>
        </ul>
      </div>
      <form className="card p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField label="Ismingiz" autoComplete="name" {...register('name')} error={errors.name?.message} />
          <TextField label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        </div>
        <TextField label="Mavzu (ixtiyoriy)" {...register('subject')} error={errors.subject?.message} />
        <TextField label="Xabar" as="textarea" rows={5} {...register('message')} error={errors.message?.message} />
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}><Send /> {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}</button>
      </form>
    </div>
  );
}
