import { useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Kit, KitCreateInput } from '../../lib/types';

const FREQS: KitCreateInput['frequency'][] = ['1m', '3m', '6m', '12m', 'use'];

interface Props {
  initial?: Kit | null;
  onSubmit: (data: KitCreateInput) => Promise<unknown> | void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}

export function KitForm({ initial, onSubmit, onCancel, busy, error }: Props) {
  const [form, setForm] = useState<KitCreateInput>({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    equipment_type: initial?.equipment_type ?? '',
    brand: initial?.brand ?? '',
    frequency: initial?.frequency ?? '6m',
    estimated_time_min: initial?.estimated_time_min ?? 0,
    price: initial?.price ?? 0,
  });

  const update = <K extends keyof KitCreateInput>(k: K, v: KitCreateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean: KitCreateInput = { ...form };
    if (!clean.brand) delete clean.brand;
    void onSubmit(clean);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Código" required>
          <input
            value={form.code}
            onChange={(e) => update('code', e.target.value)}
            disabled={!!initial}
            placeholder="KT006"
            className={inputCls + (initial ? ' opacity-60 cursor-not-allowed' : '')}
            required
          />
        </Field>
        <Field label="Frecuencia" required>
          <select
            value={form.frequency}
            onChange={(e) => update('frequency', e.target.value as KitCreateInput['frequency'])}
            className={inputCls}
            required
          >
            {FREQS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Nombre" required>
        <input
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Kit Semestral Compresor Atlas Copco GA"
          className={inputCls}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo de equipo" required>
          <input
            value={form.equipment_type}
            onChange={(e) => update('equipment_type', e.target.value)}
            placeholder="compresor / bomba..."
            className={inputCls}
            required
          />
        </Field>
        <Field label="Marca">
          <input
            value={form.brand ?? ''}
            onChange={(e) => update('brand', e.target.value)}
            placeholder="Atlas Copco"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tiempo estimado (min)">
          <input
            type="number"
            min={0}
            value={form.estimated_time_min ?? 0}
            onChange={(e) => update('estimated_time_min', parseInt(e.target.value, 10) || 0)}
            className={inputCls}
          />
        </Field>
        <Field label="Precio">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price ?? 0}
            onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
            className={inputCls}
          />
        </Field>
      </div>

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
          className="flex-1 py-2.5 rounded-lg bg-bg border border-border text-fg-muted text-sm font-semibold hover:bg-hover-bg"
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
          {busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear kit'}
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
