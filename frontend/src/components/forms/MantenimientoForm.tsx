import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import type { MantCreateInput, MantTipo } from '../../lib/types';

const TIPOS: { value: MantTipo; label: string }[] = [
  { value: 'preventive-6m',  label: 'Preventivo 6M' },
  { value: 'preventive-12m', label: 'Preventivo 12M' },
  { value: 'corrective',     label: 'Correctivo' },
  { value: 'use-based',      label: 'Por uso' },
];

interface Props {
  initialEquipoId?: string;
  onSubmit: (data: MantCreateInput) => Promise<unknown> | void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}

export function MantenimientoForm({ initialEquipoId, onSubmit, onCancel, busy, error }: Props) {
  const equiposQ = useQuery({
    queryKey: ['equipos', 'all-for-mant-form'],
    queryFn: () => api.equipos.list({ limit: 200 }),
    staleTime: 60_000,
  });
  const techsQ = useQuery({
    queryKey: ['users', 'technicians'],
    queryFn: async () => {
      // No /api/users yet — read public.users via supabase client directly.
      const { supabase } = await import('../../lib/supabase');
      const { data } = await supabase.from('users').select('id, full_name, role').order('full_name');
      return (data ?? []).filter((u) => u.role === 'technician' || u.role === 'admin');
    },
    staleTime: 60_000,
  });
  const kitsQ = useQuery({
    queryKey: ['kits', 'all'],
    queryFn: () => api.kits.list({ limit: 200 }),
    staleTime: 60_000,
  });

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<MantCreateInput>({
    equipo_id: initialEquipoId ?? '',
    tipo: 'preventive-6m',
    scheduled_date: today,
    technician_id: null,
    kit_id: null,
    notes: '',
  });

  // Auto-suggest a kit based on the equipo's type/brand and the chosen tipo
  const selectedEquipo = useMemo(
    () => equiposQ.data?.rows.find((e) => e.id === form.equipo_id) ?? null,
    [equiposQ.data, form.equipo_id],
  );
  const suggestedKit = useMemo(() => {
    if (!selectedEquipo || !kitsQ.data) return null;
    const wantedFreq = form.tipo === 'preventive-12m' ? '12m' : '6m';
    return kitsQ.data.rows.find(
      (k) =>
        k.equipment_type === selectedEquipo.type &&
        k.frequency === wantedFreq &&
        (!k.brand || k.brand === selectedEquipo.brand),
    ) ?? null;
  }, [selectedEquipo, kitsQ.data, form.tipo]);

  // Adopt the suggestion automatically when it changes (unless user already picked something)
  useEffect(() => {
    if (suggestedKit && !form.kit_id) {
      setForm((f) => ({ ...f, kit_id: suggestedKit.id }));
    }
  }, [suggestedKit, form.kit_id]);

  const update = <K extends keyof MantCreateInput>(k: K, v: MantCreateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean: MantCreateInput = { ...form };
    if (!clean.notes) delete clean.notes;
    if (!clean.technician_id) clean.technician_id = null;
    if (!clean.kit_id) clean.kit_id = null;
    void onSubmit(clean);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Tipo" required>
        <select
          value={form.tipo}
          onChange={(e) => update('tipo', e.target.value as MantTipo)}
          className={inputCls}
          required
        >
          {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>

      <Field label="Equipo" required>
        <select
          value={form.equipo_id}
          onChange={(e) => update('equipo_id', e.target.value)}
          className={inputCls}
          required
        >
          <option value="">— Seleccionar equipo —</option>
          {(equiposQ.data?.rows ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.serial} · {e.model} ({e.cliente?.name ?? '—'})
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha programada" required>
          <input
            type="date"
            value={form.scheduled_date}
            onChange={(e) => update('scheduled_date', e.target.value)}
            className={inputCls}
            required
          />
        </Field>
        <Field label="Técnico asignado">
          <select
            value={form.technician_id ?? ''}
            onChange={(e) => update('technician_id', e.target.value || null)}
            className={inputCls}
          >
            <option value="">— Sin asignar —</option>
            {(techsQ.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label={
          suggestedKit && form.kit_id === suggestedKit.id
            ? <>Kit <span className="text-primary inline-flex items-center gap-1 font-normal text-[11px]"><Sparkles size={11} /> sugerido</span></>
            : 'Kit'
        }
      >
        <select
          value={form.kit_id ?? ''}
          onChange={(e) => update('kit_id', e.target.value || null)}
          className={inputCls}
        >
          <option value="">— Sin kit —</option>
          {(kitsQ.data?.rows ?? []).map((k) => (
            <option key={k.id} value={k.id}>{k.code} · {k.name}</option>
          ))}
        </select>
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
          {busy ? 'Creando…' : 'Crear mantenimiento'}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border-[1.5px] border-border bg-input-bg text-fg text-sm outline-none focus:border-primary';

function Field({ label, required, children }: { label: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-fg-muted mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
