// Forma maydoni: label + input + xato matni. Ekran o'qish dasturlari uchun aria atributlari bilan.
import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Field({ label, error, hint, children, id }) {
  return (
    <div className="mb-4">
      {label && <label htmlFor={id} className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

// react-hook-form `register` bilan ishlaydi: <TextField label="Email" {...register('email')} error={errors.email?.message} />
export const TextField = forwardRef(function TextField({ label, error, hint, as = 'input', children, ...props }, ref) {
  const id = useId();
  const Tag = as;
  return (
    <Field label={label} error={error} hint={hint} id={id}>
      <Tag ref={ref} id={id} className="input" aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${id}-error` : undefined} {...props}>
        {children}
      </Tag>
    </Field>
  );
});

export const PasswordField = forwardRef(function PasswordField({ label = 'Parol', error, hint, ...props }, ref) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error} hint={hint} id={id}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={show ? 'text' : 'password'}
          className="input pr-11"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-brand-50 hover:text-brand-700"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
          aria-pressed={show}
        >
          {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
    </Field>
  );
});

// Server qaytargan maydon xatolarini react-hook-form ga joylaydi
export function applyServerErrors(err, setError) {
  for (const e of err?.errors || []) {
    if (e.field && e.field !== '_') setError(e.field, { type: 'server', message: e.message });
  }
}
