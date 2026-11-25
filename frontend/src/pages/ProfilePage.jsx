// Profil (barcha rollar uchun umumiy): ism, familiya, bio, avatar va parolni o'zgartirish.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Clock, GraduationCap, KeyRound, Save, Send, XCircle } from 'lucide-react';
import { PasswordField, TextField, applyServerErrors } from '../components/FormField';
import { Avatar, PageHeader, RoleBadge } from '../components/ui';
import { usersApi } from '../services/authApi';
import { teacherRequestsApi } from '../services/coursesApi';
import { useAuth } from '../contexts/AuthContext';
import { useFetch, useTitle } from '../hooks/useFetch';
import { formatDate } from '../utils/format';

const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Kamida 2 ta harf').max(60),
  lastName: z.string().trim().min(2, 'Kamida 2 ta harf').max(60),
  bio: z.string().trim().max(300, 'Ko\'pi bilan 300 ta belgi').optional(),
  avatarUrl: z.union([z.literal(''), z.string().trim().url('To\'g\'ri havola kiriting (https://...)')]).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Joriy parolni kiriting'),
    newPassword: z.string().min(8, 'Kamida 8 ta belgi').regex(/[A-Za-z]/, 'Kamida bitta harf').regex(/\d/, 'Kamida bitta raqam'),
    confirmPassword: z.string().min(1, 'Parolni tasdiqlang'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Parollar mos kelmadi' });

export default function ProfilePage() {
  useTitle('Profil');
  const { user, setUser } = useAuth();

  const profile = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName, bio: user.bio || '', avatarUrl: user.avatarUrl || '' },
  });
  const pwd = useForm({ resolver: zodResolver(passwordSchema) });

  const saveProfile = async (values) => {
    try {
      const { user: u } = await usersApi.update(values);
      setUser(u);
      toast.success('Profil saqlandi');
    } catch (e) {
      applyServerErrors(e, profile.setError);
      toast.error(e.message);
    }
  };

  const savePassword = async (values) => {
    try {
      await usersApi.changePassword(values);
      toast.success('Parol o\'zgartirildi');
      pwd.reset();
    } catch (e) {
      applyServerErrors(e, pwd.setError);
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="Profil" subtitle="Shaxsiy ma'lumotlaringiz" />
      <div className="card mb-6 flex flex-wrap items-center gap-4 p-5">
        <Avatar user={user} size="size-16 text-xl" />
        <div>
          <p className="text-lg font-bold">{user.firstName} {user.lastName}</p>
          <p className="text-muted">{user.email}</p>
        </div>
        <div className="ml-auto text-right text-sm text-muted">
          <RoleBadge role={user.role} />
          <p className="mt-1">Ro'yxatdan o'tgan: {formatDate(user.createdAt)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="card p-6" onSubmit={profile.handleSubmit(saveProfile)} noValidate>
          <h2 className="mb-4 text-lg font-bold">Ma'lumotlarni tahrirlash</h2>
          <TextField label="Ism" {...profile.register('firstName')} error={profile.formState.errors.firstName?.message} />
          <TextField label="Familiya" {...profile.register('lastName')} error={profile.formState.errors.lastName?.message} />
          <TextField label="Email" value={user.email} disabled readOnly hint="Emailni o'zgartirib bo'lmaydi" />
          <TextField label="Avatar havolasi (ixtiyoriy)" placeholder="https://..." {...profile.register('avatarUrl')} error={profile.formState.errors.avatarUrl?.message} />
          <TextField label="O'zingiz haqingizda" as="textarea" rows={3} {...profile.register('bio')} error={profile.formState.errors.bio?.message} />
          <button type="submit" className="btn btn-primary" disabled={profile.formState.isSubmitting}><Save /> Saqlash</button>
        </form>

        <form className="card p-6" onSubmit={pwd.handleSubmit(savePassword)} noValidate>
          <h2 className="mb-4 text-lg font-bold">Parolni o'zgartirish</h2>
          <PasswordField label="Joriy parol" autoComplete="current-password" {...pwd.register('currentPassword')} error={pwd.formState.errors.currentPassword?.message} />
          <PasswordField label="Yangi parol" autoComplete="new-password" {...pwd.register('newPassword')} error={pwd.formState.errors.newPassword?.message} />
          <PasswordField label="Yangi parolni tasdiqlang" autoComplete="new-password" {...pwd.register('confirmPassword')} error={pwd.formState.errors.confirmPassword?.message} />
          <button type="submit" className="btn btn-outline" disabled={pwd.formState.isSubmitting}><KeyRound /> Parolni yangilash</button>
        </form>
      </div>
      {user.role === 'STUDENT' && <TeacherRequestCard />}
    </div>
  );
}

const requestSchema = z.object({
  expertise: z.string().trim().min(3, 'Kamida 3 ta belgi').max(100),
  experience: z.string().trim().min(20, 'Tajribangiz haqida kamida 20 ta belgi yozing').max(2000),
});

// "O'qituvchi bo'lish uchun ariza": talaba yuboradi, super admin ko'rib chiqadi.
// Rol shu yerda o'zgarmaydi — faqat admin qabul qilgach (backendda) TEACHER bo'ladi.
function TeacherRequestCard() {
  const { data, loading, reload } = useFetch(() => teacherRequestsApi.mine(), []);
  const form = useForm({ resolver: zodResolver(requestSchema) });
  const last = data?.[0];

  const submit = async (values) => {
    try {
      await teacherRequestsApi.create(values);
      toast.success("Ariza yuborildi. Administrator ko'rib chiqadi.");
      form.reset();
      reload();
    } catch (e) {
      applyServerErrors(e, form.setError);
      toast.error(e.message);
    }
  };

  if (loading) return null;
  return (
    <section className="card mt-6 p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold"><GraduationCap className="size-5 text-brand-600" /> O'qituvchi bo'lish uchun ariza</h2>
      {last?.status === 'PENDING' ? (
        <div className="mt-4 flex gap-3 rounded-xl bg-amber-50 p-4 text-amber-800">
          <Clock className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Arizangiz ko'rib chiqilmoqda</p>
            <p className="text-sm">Yuborilgan: {formatDate(last.createdAt)} · Mutaxassislik: {last.expertise}</p>
          </div>
        </div>
      ) : (
        <>
          {last?.status === 'REJECTED' && (
            <div className="mt-4 flex gap-3 rounded-xl bg-red-50 p-4 text-red-700">
              <XCircle className="mt-0.5 size-5 shrink-0" />
              <p className="text-sm">Oldingi arizangiz ({formatDate(last.reviewedAt)}) rad etilgan. Ma'lumotlarni to'ldirib, qayta yuborishingiz mumkin.</p>
            </div>
          )}
          <p className="mt-2 text-muted">Kurs yaratmoqchi bo'lsangiz, ariza qoldiring. Administrator qabul qilgach, keyingi kirishingizda o'qituvchi paneli ochiladi.</p>
          <form className="mt-4 grid gap-x-4 md:grid-cols-[1fr_2fr]" onSubmit={form.handleSubmit(submit)} noValidate>
            <TextField label="Mutaxassislik" placeholder="Masalan: Frontend dasturlash" {...form.register('expertise')} error={form.formState.errors.expertise?.message} />
            <TextField label="Tajribangiz haqida" as="textarea" rows={3} placeholder="Qayerda, qancha vaqt ishlagansiz, nimani o'rgata olasiz?" {...form.register('experience')} error={form.formState.errors.experience?.message} />
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary" disabled={form.formState.isSubmitting}><Send /> Ariza yuborish</button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
