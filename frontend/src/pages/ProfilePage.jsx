// Profil (barcha rollar uchun umumiy): ism, familiya, bio, avatar va parolni o'zgartirish.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { KeyRound, Save } from 'lucide-react';
import { PasswordField, TextField, applyServerErrors } from '../components/FormField';
import { Avatar, PageHeader, RoleBadge } from '../components/ui';
import { usersApi } from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';
import { useTitle } from '../hooks/useFetch';
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
    </div>
  );
}
