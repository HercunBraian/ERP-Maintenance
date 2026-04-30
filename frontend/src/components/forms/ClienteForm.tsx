import { useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Cliente, ClienteCreateInput } from '../../lib/types';

const TYPES = ['Total Care', 'Remoto', 'Preventive', 'Total Remoto', 'Full Preventive', 'Otro'] as const;
const STATUSES = ['active', 'inactive'] as const;

interface Props {
  initial?: Cliente | null;
  onSubmit: (data: ClienteCreateInput) => Promise<unknown> | void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}

export function ClienteForm({ initial, onSubmit, onCancel, busy, error }: Props) {
  const [form, setForm] = useState<ClienteCreateInput>({
    name: initial?.name ?? '',
    address: initial?.address ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    contact_name: initial?.contact_name ?? '',
    type: initial?.type ?? 'Total Care',
    status: initial?.status ?? 'active',
  });

  const update = <K extends keyof ClienteCreateInput>(k: K, v: ClienteCreateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // Strip empty optional strings so the backend doesn't try to validate them
    const clean: ClienteCreateInput = { ...form };
    (['address', 'phone', 'email', 'contact_name'] as const).forEach((k) => {
      if (clean[k] === '') delete clean[k];
    });
    void onSubmit(clean);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Estado">
        <select
          value={form.status}
          onChange={(e) => update('status', e.target.value as 'active' | 'inactive')}
          className={inputCls}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'active' ? 'Activo' : 'Inactivo'}</option>)}
        </select>
      </Field>

      <Field label="Nombre" required>
        <input
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Industrias Acme S.A."
          className={inputCls}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value as ClienteCreateInput['type'])}
            className={inputCls}
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Contacto">
          <input
            value={form.contact_name ?? ''}
            onChange={(e) => update('contact_name', e.target.value)}
            placeholder="Ing. Juan Pérez"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => update('email', e.target.value)}
            placeholder="contacto@empresa.com"
            className={inputCls}
          />
        </Field>
        <Field label="Teléfono">
          <input
            value={form.phone ?? ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+54 11 1234-5678"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Dirección">
        <input
          value={form.address ?? ''}
          onChange={(e) => update('address', e.target.value)}
          placeholder="Av. Industrial 1234, Buenos Aires"
          className={inputCls}
        />
      </Field>

      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg bg-bg border border-border text-fg-muted text-sm font-semibold hover:bg-hover-bg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy}
          className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity ${
            busy ? 'bg-primary-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'
          }`}
        >
          {busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border-[1.5px] border-border bg-input-bg text-fg text-sm outline-none focus:border-primary';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-fg-muted mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
