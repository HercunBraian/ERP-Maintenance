import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Phone, Building2, Shield, Wrench, Lock, Save, Check, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/badges';

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'technician';
  avatar: string | null;
  phone: string | null;
  dept: string | null;
}

export function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar, phone, dept')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as ProfileRow | null;
    },
    enabled: !!user?.id,
  });

  if (!user) return null;

  return (
    <div className="px-7 pt-7 pb-10 max-w-3xl">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-card flex items-center gap-4 flex-wrap">
        <Avatar initials={user.avatar ?? user.fullName.slice(0, 2).toUpperCase()} size={64} />
        <div className="flex-1 min-w-0">
          <div className="text-xl font-extrabold text-fg">{user.fullName}</div>
          <div className="text-sm text-fg-muted">{user.email}</div>
          <span
            className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
            style={{
              background: user.role === 'admin' ? '#dbeafe' : '#dcfce7',
              color:      user.role === 'admin' ? '#1e40af' : '#166534',
            }}
          >
            {user.role === 'admin' ? <Shield size={11} /> : <Wrench size={11} />}
            {user.role === 'admin' ? 'Administrador' : 'Técnico'}
          </span>
        </div>
      </div>

      {/* Info personal */}
      <Section icon={User} title="Información personal">
        {profile.data && <PersonalForm initial={profile.data} onSaved={() => qc.invalidateQueries({ queryKey: ['profile'] })} />}
      </Section>

      {/* Password */}
      <Section icon={Lock} title="Cambiar contraseña">
        <PasswordForm />
      </Section>
    </div>
  );
}

// ─── Personal info form ──────────────────────────────────────────────────────

function PersonalForm({ initial, onSaved }: { initial: ProfileRow; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: initial.full_name ?? '',
    dept:      initial.dept ?? '',
    phone:     initial.phone ?? '',
    avatar:    initial.avatar ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: form.full_name,
          dept:      form.dept || null,
          phone:     form.phone || null,
          avatar:    form.avatar.slice(0, 2).toUpperCase() || null,
        })
        .eq('id', initial.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setSaved(true);
      setError(null);
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Error inesperado'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    m.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nombre completo" icon={User} required>
        <input
          value={form.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          className={inputCls}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Iniciales del avatar">
          <input
            value={form.avatar}
            onChange={(e) => update('avatar', e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            placeholder="AS"
            className={inputCls + ' uppercase font-bold tracking-widest'}
          />
        </Field>
        <Field label="Teléfono" icon={Phone}>
          <input
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+54 11 1234-5678"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Departamento" icon={Building2}>
        <input
          value={form.dept}
          onChange={(e) => update('dept', e.target.value)}
          placeholder="Técnicos de campo"
          className={inputCls}
        />
      </Field>

      <Field label="Email (no editable)" icon={Mail}>
        <input
          value={initial.email}
          disabled
          className={inputCls + ' opacity-60 cursor-not-allowed'}
        />
      </Field>

      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={m.isPending}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity ${
            m.isPending ? 'bg-primary-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'
          }`}
        >
          <Save size={14} /> {m.isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600 font-semibold">
            <Check size={14} /> Guardado
          </span>
        )}
      </div>
    </form>
  );
}

// ─── Password change form ────────────────────────────────────────────────────

function PasswordForm() {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: async () => {
      if (pw.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
      if (pw !== confirm) throw new Error('Las contraseñas no coinciden');
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setDone(true);
      setError(null);
      setPw('');
      setConfirm('');
      setTimeout(() => setDone(false), 2500);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Error inesperado'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    m.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nueva contraseña" required>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          className={inputCls}
          required
        />
      </Field>
      <Field label="Confirmar nueva contraseña" required>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
          required
        />
      </Field>

      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={m.isPending || !pw}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity ${
            m.isPending || !pw ? 'bg-primary-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'
          }`}
        >
          <Lock size={14} /> {m.isPending ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
        {done && (
          <span className="flex items-center gap-1 text-sm text-emerald-600 font-semibold">
            <Check size={14} /> Contraseña actualizada
          </span>
        )}
      </div>
    </form>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg border-[1.5px] border-border bg-input-bg text-fg text-sm outline-none focus:border-primary';

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card mb-5 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Icon size={15} className="text-primary" />
        <span className="text-sm font-bold text-fg">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label, required, icon: Icon, children,
}: { label: string; required?: boolean; icon?: typeof User; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-fg-muted mb-1.5 flex items-center gap-1">
        {Icon && <Icon size={11} />} {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
