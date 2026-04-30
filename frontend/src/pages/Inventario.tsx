import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Sliders, AlertTriangle } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type {
  AdjustStockInput, RepuestoCreateInput, StockRow,
} from '../lib/types';
import { Modal } from '../components/Modal';
import { StockAdjustForm } from '../components/forms/StockAdjustForm';
import { RepuestoForm } from '../components/forms/RepuestoForm';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../hooks/useRealtime';

export function Inventario() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [lowOnly, setLowOnly] = useState(false);
  const [adjusting, setAdjusting] = useState<StockRow | null>(null);
  const [adjustingFresh, setAdjustingFresh] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [creatingRepuesto, setCreatingRepuesto] = useState(false);
  const [repuestoError, setRepuestoError] = useState<string | null>(null);

  const stock = useQuery({
    queryKey: ['stock', { lowOnly }],
    queryFn: () => api.stock.list({ low_stock: lowOnly, limit: 200 }),
  });

  useRealtime('rt-inventario-stock', 'stock_por_deposito',
    useCallback(() => qc.invalidateQueries({ queryKey: ['stock'] }), [qc]));

  const adjustM = useMutation({
    mutationFn: (data: AdjustStockInput) => api.stock.adjust(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] });
      setAdjusting(null);
      setAdjustingFresh(false);
      setAdjustError(null);
    },
    onError: (err) => setAdjustError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  const createRepuestoM = useMutation({
    mutationFn: (data: RepuestoCreateInput) => api.repuestos.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repuestos'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      setCreatingRepuesto(false);
      setRepuestoError(null);
    },
    onError: (err) => setRepuestoError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  const rows = stock.data?.rows ?? [];
  const criticalCount = rows.filter((r) => r.stock <= r.critical_stock).length;
  const lowCount = rows.filter((r) => r.stock > r.critical_stock && r.stock <= r.min_stock).length;

  return (
    <div className="px-7 pt-7 pb-10">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <KPI value={rows.length}     label="Filas de stock"  color="#2563eb" />
        <KPI value={criticalCount}   label="Stock crítico"   color="#ef4444" highlight />
        <KPI value={lowCount}        label="Stock bajo"      color="#f59e0b" highlight />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => setLowOnly((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
            lowOnly
              ? 'bg-primary text-white border-primary'
              : 'bg-card text-fg-muted border-border hover:bg-hover-bg'
          }`}
        >
          <AlertTriangle size={14} /> Solo stock bajo
        </button>
        <span className="text-sm text-fg-subtle flex-1">
          Mostrando {rows.length} de {stock.data?.total ?? 0}
        </span>
        {isAdmin && (
          <>
            <button
              onClick={() => { setRepuestoError(null); setCreatingRepuesto(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-bg border border-border text-fg-muted rounded-lg text-sm font-semibold hover:bg-hover-bg"
            >
              <Plus size={14} /> Nuevo repuesto
            </button>
            <button
              onClick={() => { setAdjustError(null); setAdjustingFresh(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
            >
              <Sliders size={14} /> Ajustar stock
            </button>
          </>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-input-bg border-b border-border">
                <Th>Repuesto</Th>
                <Th>Depósito</Th>
                <Th align="right">Stock</Th>
                <Th align="right">Mínimo</Th>
                <Th align="right">Crítico</Th>
                <Th align="right">Precio unit.</Th>
                <Th>Estado</Th>
                <Th>{isAdmin && '·'}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isCritical = r.stock <= r.critical_stock;
                const isLow = !isCritical && r.stock <= r.min_stock;
                return (
                  <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-hover-bg">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-fg-subtle" />
                        <div>
                          <div className="text-[13px] font-semibold text-fg">{r.repuesto.name}</div>
                          <div className="text-[11px] text-fg-subtle font-mono">{r.repuesto.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-fg-muted">{r.deposito.name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-base font-extrabold"
                           style={{ color: isCritical ? '#ef4444' : isLow ? '#f59e0b' : 'var(--text)' }}>
                        {r.stock}
                      </div>
                      <div className="text-[10px] text-fg-subtle">{r.repuesto.unit}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] text-fg-muted">{r.min_stock}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-fg-muted">{r.critical_stock}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-fg-muted">
                      ${r.repuesto.price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill critical={isCritical} low={isLow} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && (
                        <button
                          onClick={() => { setAdjustError(null); setAdjusting(r); }}
                          className="text-primary text-xs font-semibold hover:opacity-80"
                        >
                          Ajustar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-fg-subtle text-sm">
                    {lowOnly ? 'Sin items en stock bajo.' : 'Sin items.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!adjusting || adjustingFresh}
        onClose={() => { setAdjusting(null); setAdjustingFresh(false); }}
        title={adjusting ? `Ajustar stock — ${adjusting.repuesto.code}` : 'Ajustar stock'}
        maxWidth={460}
      >
        <StockAdjustForm
          initialStock={adjusting}
          onSubmit={(data) => adjustM.mutateAsync(data)}
          onCancel={() => { setAdjusting(null); setAdjustingFresh(false); }}
          busy={adjustM.isPending}
          error={adjustError}
        />
      </Modal>

      <Modal
        open={creatingRepuesto}
        onClose={() => setCreatingRepuesto(false)}
        title="Nuevo repuesto"
        maxWidth={520}
      >
        <RepuestoForm
          onCancel={() => setCreatingRepuesto(false)}
          onSubmit={(data) => createRepuestoM.mutateAsync(data)}
          busy={createRepuestoM.isPending}
          error={repuestoError}
        />
      </Modal>
    </div>
  );
}

function KPI({ value, label, color, highlight }: { value: number; label: string; color: string; highlight?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card">
      <div className="text-2xl font-extrabold leading-none" style={{ color: highlight && value > 0 ? color : 'var(--text)' }}>
        {value}
      </div>
      <div className="text-[11px] text-fg-subtle mt-1">{label}</div>
    </div>
  );
}

function StatusPill({ critical, low }: { critical: boolean; low: boolean }) {
  if (critical) {
    return <span className="inline-flex items-center rounded-full bg-badge-red-bg text-badge-red-fg px-2 py-0.5 text-[11px] font-bold">Crítico</span>;
  }
  if (low) {
    return <span className="inline-flex items-center rounded-full bg-badge-yellow-bg text-badge-yellow-fg px-2 py-0.5 text-[11px] font-bold">Bajo</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-badge-green-bg text-badge-green-fg px-2 py-0.5 text-[11px] font-bold">Normal</span>;
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-2.5 text-${align} text-[10px] font-bold text-fg-subtle uppercase tracking-wider whitespace-nowrap`}>
      {children}
    </th>
  );
}
