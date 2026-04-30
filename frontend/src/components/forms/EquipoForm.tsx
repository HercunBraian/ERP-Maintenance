import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import type { Equipo, EquipoCreateInput } from '../../lib/types';

const INTERVALS = ['1m', '3m', '6m', '12m'] as const;

interface Props {
  initial?: Equipo | null;
  onSubmit: (data: EquipoCreateInput) => Promise<unknown> | void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}

export function EquipoForm({ initial, onSubmit, onCancel, busy, error }: Props) {
  const clientesQ = useQuery({
    queryKey: ['clientes', 'all-for-equipo-form'],
    queryFn: () => api.clientes.list({ limit: 200 }),
    staleTime: 60_000,
  });

  const [form, setForm] = useState<EquipoCreateInput>({
    serial: initial?.serial ?? '',
    model: initial?.model ?? '',
    brand: initial?.brand ?? '',
    type: initial?.type ?? '',
    category: initial?.category ?? '',
    cliente_id: initial?.cliente_id ?? '',
    install_date: initial?.install_date ?? '',
    maintenance_interval: (initial?.maintenance_interval as EquipoCreateInput['maintenance_interval']) ?? '6m',
    location: initial?.location ?? '',
    notes: initial?.notes ?? '',
  });

  const update = <K extends keyof EquipoCreateInput>(k: K, v: EquipoCreateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean: EquipoCreateInput = { ...form };
    (['category', 'install_date', 'location', 'notes'] as const).forEach((k) => {
      if (clean[k] === '' || clean[k] === undefined) delete clean[k];
    });
    void onSubmit(clean);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Serie" required>
        <input
          value={form.serial}
          onChange={(e) => update('serial', e.target.value)}
          placeholder="FX-COMP-099"
          className={inputCls}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Marca" required>
          <input
            value={form.brand}
            onChange={(e) => update('brand', e.target.value)}
            placeholder="Atlas Copco"
            className={inputCls}
            required
          />
        </Field>
        <Field label="Modelo" required>
          <input
            value={form.model}
            onChange={(e) => update('model', e.target.value)}
            placeholder="GA90"
            className={inputCls}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo" required>
          <input
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            placeholder="compresor / bomba / motor..."
            className={inputCls}
            required
          />
        </Field>
        <Field label="Categoría">
          <input
            value={form.category ?? ''}
            onChange={(e) => update('category', e.target.value)}
            placeholder="Neumática / Hidráulica..."
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Cliente" required>
        <select
          value={form.cliente_id}
          onChange={(e) => update('cliente_id', e.target.value)}
          className={inputCls}
          required
        >
          <option value="">— Seleccionar cliente —</option>
          {(clientesQ.data?.rows ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha de instalación">
          <input
            type="date"
            value={form.install_date ?? ''}
            onChange={(e) => update('install_date', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Frecuencia mantenimiento">
          <select
            value={form.maintenance_interval}
            onChange={(e) =>
              update('maintenance_interval', e.target.value as EquipoCreateInput['maintenance_interval'])
            }
            className={inputCls}
          >
            {INTERVALS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Ubicación">
        <input
          value={form.location ?? ''}
          onChange={(e) => update('location', e.target.value)}
          placeholder="Sala de máquinas 1"
          className={inputCls}
        />
      </Field>

      <Field label="Notas">
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => update('notes', e.target.value)}
          rows={2}
          className={inputCls + ' resize-none'}
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
          {busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear equipo'}
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
