import { useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { repuesto_id: string; qty: number; deposito_id: string }) => Promise<unknown> | void;
  busy?: boolean;
  error?: string | null;
}

export function AddPartModal({ open, onClose, onSubmit, busy, error }: Props) {
  const stockQ = useQuery({
    queryKey: ['stock', 'all-for-add-part'],
    queryFn: () => api.stock.list({ limit: 500 }),
    enabled: open,
    staleTime: 30_000,
  });

  // Group stock rows by repuesto for the select
  const repuestos = useMemo(() => {
    const m = new Map<string, { id: string; code: string; name: string; unit: string }>();
    for (const r of stockQ.data?.rows ?? []) m.set(r.repuesto.id, r.repuesto);
    return Array.from(m.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [stockQ.data]);

  const [repuestoId, setRepuestoId] = useState('');
  const [depositoId, setDepositoId] = useState('');
  const [qty, setQty] = useState(1);

  // Depots that have this repuesto
  const depositos = useMemo(() => {
    if (!repuestoId) return [];
    return (stockQ.data?.rows ?? [])
      .filter((r) => r.repuesto.id === repuestoId)
      .map((r) => ({ ...r.deposito, stock: r.stock }));
  }, [stockQ.data, repuestoId]);

  // Reset depot when repuesto changes; default to the first available
  useMemo(() => {
    if (!repuestoId) return;
    const first = depositos[0];
    if (first && !depositos.find((d) => d.id === depositoId)) {
      setDepositoId(first.id);
    }
  }, [repuestoId, depositos, depositoId]);

  const selectedDepot = depositos.find((d) => d.id === depositoId);
  const insufficient = selectedDepot ? qty > selectedDepot.stock : false;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!repuestoId || !depositoId || qty <= 0) return;
    void onSubmit({ repuesto_id: repuestoId, deposito_id: depositoId, qty });
  };

  return (
    <Modal open={open} onClose={onClose} title="Cargar repuesto consumido" maxWidth={460}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Repuesto" required>
          <select
            value={repuestoId}
            onChange={(e) => setRepuestoId(e.target.value)}
            className={inputCls}
            required
          >
            <option value="">— Seleccionar repuesto —</option>
            {repuestos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} · {r.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Depósito" required>
          <select
            value={depositoId}
            onChange={(e) => setDepositoId(e.target.value)}
            disabled={!repuestoId}
            className={inputCls}
            required
          >
            <option value="">— Seleccionar depósito —</option>
            {depositos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} (stock: {d.stock})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cantidad" required>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-lg border border-border bg-bg text-fg-muted hover:bg-hover-bg flex items-center justify-center"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className={inputCls + ' text-center font-semibold'}
            />
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="w-9 h-9 rounded-lg border border-border bg-bg text-fg-muted hover:bg-hover-bg flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
          </div>
          {insufficient && (
            <div className="text-xs text-red-500 mt-1.5 font-semibold">
              Stock insuficiente — disponible: {selectedDepot?.stock}
            </div>
          )}
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
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-bg border border-border text-fg-muted text-sm font-semibold hover:bg-hover-bg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy || !repuestoId || !depositoId || insufficient}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity ${
              busy || !repuestoId || !depositoId || insufficient
                ? 'bg-primary-muted cursor-not-allowed'
                : 'bg-primary hover:opacity-90'
            }`}
          >
            {busy ? 'Cargando…' : 'Cargar repuesto'}
          </button>
        </div>
      </form>
    </Modal>
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
