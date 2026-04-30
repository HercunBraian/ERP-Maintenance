import { useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Repuesto, RepuestoCreateInput } from '../../lib/types';

interface Props {
  initial?: Repuesto | null;
  onSubmit: (data: RepuestoCreateInput) => Promise<unknown> | void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}

export function RepuestoForm({ initial, onSubmit, onCancel, busy, error }: Props) {
  const [form, setForm] = useState<RepuestoCreateInput>({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    unit: initial?.unit ?? 'unidad',
    price: initial?.price ?? 0,
    compatible_models: initial?.compatible_models ?? [],
  });
  const [modelsInput, setModelsInput] = useState(
    (initial?.compatible_models ?? []).join(', '),
  );

  const update = <K extends keyof RepuestoCreateInput>(k: K, v: RepuestoCreateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const compatible = modelsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const clean: RepuestoCreateInput = { ...form, compatible_models: compatible };
    if (!clean.description) delete clean.description;
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
            placeholder="FLT-AIRE-099"
            className={inputCls + (initial ? ' opacity-60 cursor-not-allowed' : '')}
            required
          />
        </Field>
        <Field label="Unidad">
          <input
            value={form.unit ?? ''}
            onChange={(e) => update('unit', e.target.value)}
            placeholder="unidad / kit / cilindro / litro"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Nombre" required>
        <input
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Filtro de aire compresor"
          className={inputCls}
          required
        />
      </Field>

      <Field label="Descripción">
        <input
          value={form.description ?? ''}
          onChange={(e) => update('description', e.target.value)}
          placeholder={`Filtro separador 1" NPT`}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
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
        <Field label="Modelos compatibles">
          <input
            value={modelsInput}
            onChange={(e) => setModelsInput(e.target.value)}
            placeholder="GA90, R110"
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
          {busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear repuesto'}
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
