import { useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import type { AdjustStockInput, StockRow } from '../../lib/types';

interface Props {
  /** Pre-fill AND lock repuesto + deposito (when adjusting from a specific stock row). */
  initialStock?: StockRow | null;
  /** Pre-fill AND lock repuesto only (user still picks deposito). */
  lockedRepuesto?: { id: string; name: string; code: string } | null;
  onSubmit: (data: AdjustStockInput) => Promise<unknown> | void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}

export function StockAdjustForm({ initialStock, lockedRepuesto, onSubmit, onCancel, busy, error }: Props) {
  const needRepuestoSelect = !initialStock && !lockedRepuesto;

  const repuestosQ = useQuery({
    queryKey: ['repuestos', 'all-for-stock-form'],
    queryFn:  () => api.repuestos.list({ limit: 200 }),
    enabled:  needRepuestoSelect,
    staleTime: 60_000,
  });

  const depositosQ = useQuery({
    queryKey: ['depositos', 'all'],
    queryFn:  () => api.depositos.list(),
    staleTime: 60_000,
  });

  const [repuestoId, setRepuestoId] = useState(
    initialStock?.repuesto.id ?? lockedRepuesto?.id ?? '',
  );
  const [depositoId, setDepositoId] = useState(initialStock?.deposito.id ?? '');
  const [delta, setDelta]           = useState(0);
  const [notes, setNotes]           = useState('');

  const currentStock = initialStock?.stock ?? 0;
  const newStock = useMemo(() => Math.max(0, currentStock + delta), [currentStock, delta]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!repuestoId || !depositoId || delta === 0) return;
    void onSubmit({ repuesto_id: repuestoId, deposito_id: depositoId, delta, notes: notes || undefined });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* ── Repuesto display ─────────────────────────────────────────────── */}
      {initialStock ? (
        // Locked: repuesto + deposito + current stock info
        <div className="bg-input-bg border border-border rounded-lg p-3">
          <div className="text-[11px] font-bold text-fg-subtle uppercase tracking-wider mb-1">Repuesto</div>
          <div className="text-sm font-bold text-fg">{initialStock.repuesto.name}</div>
          <div className="text-xs text-fg-muted">
            {initialStock.repuesto.code} · {initialStock.deposito.name}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-fg-subtle">Stock actual:</span>
            <span className="text-fg font-bold text-base">{currentStock}</span>
            {delta !== 0 && (
              <>
                <span className="text-fg-subtle">→ Nuevo:</span>
                <span className="font-bold text-base" style={{ color: delta > 0 ? '#059669' : '#ef4444' }}>
                  {newStock}
                </span>
              </>
            )}
          </div>
        </div>
      ) : lockedRepuesto ? (
        // Locked repuesto, free deposito
        <div className="bg-input-bg border border-border rounded-lg p-3">
          <div className="text-[11px] font-bold text-fg-subtle uppercase tracking-wider mb-1">Repuesto</div>
          <div className="text-sm font-bold text-fg">{lockedRepuesto.name}</div>
          <div className="text-xs text-fg-muted font-mono">{lockedRepuesto.code}</div>
        </div>
      ) : (
        // Free repuesto select
        <Field label="Repuesto" required>
          <select
            value={repuestoId}
            onChange={(e) => setRepuestoId(e.target.value)}
            className={inputCls}
            required
          >
            <option value="">— Seleccionar repuesto —</option>
            {(repuestosQ.data?.rows ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.code} · {r.name}</option>
            ))}
          </select>
        </Field>
      )}

      {/* ── Deposito ─────────────────────────────────────────────────────── */}
      {!initialStock && (
        <Field label="Depósito" required>
          <select
            value={depositoId}
            onChange={(e) => setDepositoId(e.target.value)}
            className={inputCls}
            required
          >
            <option value="">— Seleccionar depósito —</option>
            {(depositosQ.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>
      )}

      {/* ── Delta ────────────────────────────────────────────────────────── */}
      <Field label="Movimiento (+ ingreso, − egreso)" required>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDelta((d) => d - 1)}
            className="w-9 h-9 rounded-lg border border-border bg-bg text-red-500 hover:bg-hover-bg flex items-center justify-center">
            <Minus size={14} />
          </button>
          <input
            type="number" value={delta}
            onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
            className={inputCls + ' text-center font-extrabold text-lg'}
          />
          <button type="button" onClick={() => setDelta((d) => d + 1)}
            className="w-9 h-9 rounded-lg border border-border bg-bg text-emerald-600 hover:bg-hover-bg flex items-center justify-center">
            <Plus size={14} />
          </button>
        </div>
      </Field>

      <Field label="Motivo">
        <input value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Compra, ajuste por inventario físico, etc."
          className={inputCls} />
      </Field>

      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-border">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg bg-bg border border-border text-fg-muted text-sm font-semibold hover:bg-hover-bg">
          Cancelar
        </button>
        <button type="submit"
          disabled={busy || !repuestoId || !depositoId || delta === 0}
          className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity ${
            busy || !repuestoId || !depositoId || delta === 0
              ? 'bg-primary-muted cursor-not-allowed'
              : 'bg-primary hover:opacity-90'
          }`}>
          {busy ? 'Aplicando…' : 'Aplicar ajuste'}
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
