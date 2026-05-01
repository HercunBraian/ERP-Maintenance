import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, BarChart2, Edit2, Package, Plus, Search, Sliders, Trash2,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type {
  AdjustStockInput, RepuestoCreateInput, SetThresholdsInput, StockRow,
} from '../lib/types';
import { Modal } from '../components/Modal';
import { StockAdjustForm } from '../components/forms/StockAdjustForm';
import { RepuestoForm } from '../components/forms/RepuestoForm';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../hooks/useRealtime';

// ─── Types ─────────────────────────────────────────────────────────────────

interface LockedRepuesto { id: string; name: string; code: string }

// ─── Component ────────────────────────────────────────────────────────────────

export function Inventario() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Filters
  const [search, setSearch]             = useState('');
  const [depositoFilter, setDepositoFilter] = useState('');
  const [hasStockOnly, setHasStockOnly] = useState(false);

  // Adjust-stock modal
  const [adjustTarget, setAdjustTarget] = useState<{
    stockRow: StockRow | null;
    lockedRepuesto: LockedRepuesto | null;
  } | null>(null);
  const [adjustFresh, setAdjustFresh]   = useState(false);
  const [adjustError, setAdjustError]   = useState<string | null>(null);

  // Create repuesto  (step 1) → then initial-stock prompt (step 2)
  const [creatingRepuesto, setCreatingRepuesto]             = useState(false);
  const [repuestoError, setRepuestoError]                   = useState<string | null>(null);
  const [postCreate, setPostCreate]                         = useState<LockedRepuesto | null>(null);
  const [postCreateError, setPostCreateError]               = useState<string | null>(null);

  // Edit repuesto
  const [editingRepuestoId, setEditingRepuestoId]           = useState<string | null>(null);
  const [editError, setEditError]                           = useState<string | null>(null);

  // Delete repuesto
  const [deletingRepuesto, setDeletingRepuesto]             = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError]                       = useState<string | null>(null);

  // Thresholds (requires deposito filter to be active)
  const [editingThresholds, setEditingThresholds]           = useState<{
    repuesto: LockedRepuesto;
    stockRow: StockRow | null;
  } | null>(null);
  const [thresholdsError, setThresholdsError]               = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  // Primary data source: ALL repuestos, always
  const repuestosQ = useQuery({
    queryKey: ['repuestos', 'all-for-inventory'],
    queryFn:  () => api.repuestos.list({ limit: 500 }),
    staleTime: 30_000,
  });

  const depositosQ = useQuery({
    queryKey: ['depositos', 'all'],
    queryFn:  () => api.depositos.list(),
    staleTime: 60_000,
  });

  // Secondary: stock data for overlay
  const stockQ = useQuery({
    queryKey: ['stock'],
    queryFn:  () => api.stock.list({ limit: 5000 }),
  });

  const editRepuestoQ = useQuery({
    queryKey: ['repuestos', editingRepuestoId],
    queryFn:  () => api.repuestos.get(editingRepuestoId!),
    enabled:  !!editingRepuestoId,
    staleTime: 0,
  });

  useRealtime('rt-inventario-stock', 'stock_por_deposito',
    useCallback(() => qc.invalidateQueries({ queryKey: ['stock'] }), [qc]));

  // ── Stock lookup: repuesto_id → deposito_id → StockRow ────────────────────

  const stockIndex = useMemo(() => {
    const idx = new Map<string, Map<string, StockRow>>();
    for (const s of stockQ.data?.rows ?? []) {
      if (!idx.has(s.repuesto.id)) idx.set(s.repuesto.id, new Map());
      idx.get(s.repuesto.id)!.set(s.deposito.id, s);
    }
    return idx;
  }, [stockQ.data]);

  // ── Derived display rows (one per repuesto) ────────────────────────────────

  const allRepuestos = repuestosQ.data?.rows ?? [];
  const selectedDeposito = depositoFilter
    ? (depositosQ.data ?? []).find((d) => d.id === depositoFilter)
    : null;

  const allRows = useMemo(() => {
    return allRepuestos.map((rep) => {
      const byDeposito = stockIndex.get(rep.id) ?? new Map<string, StockRow>();
      const depositoRow = depositoFilter ? (byDeposito.get(depositoFilter) ?? null) : null;
      const totalStock  = depositoFilter
        ? (depositoRow?.stock ?? 0)
        : [...byDeposito.values()].reduce((s, r) => s + r.stock, 0);
      const depositoCount = byDeposito.size;
      return { rep, depositoRow, totalStock, depositoCount };
    });
  }, [allRepuestos, stockIndex, depositoFilter]);

  const filtered = useMemo(() => {
    let rows = allRows;
    // When a deposito is selected, only show repuestos that have an entry there.
    if (depositoFilter) rows = rows.filter((r) => r.depositoRow !== null);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) => r.rep.name.toLowerCase().includes(q) || r.rep.code.toLowerCase().includes(q),
      );
    }
    if (hasStockOnly) rows = rows.filter((r) => r.totalStock > 0);
    return rows;
  }, [allRows, search, hasStockOnly, depositoFilter]);

  const criticalCount = allRows.filter(({ depositoRow, totalStock }) =>
    depositoFilter
      ? depositoRow && totalStock > 0 && totalStock <= (depositoRow.critical_stock ?? 0)
      : false,
  ).length;
  const lowCount = allRows.filter(({ depositoRow, totalStock }) =>
    depositoFilter
      ? depositoRow && totalStock > 0 && totalStock <= (depositoRow.min_stock ?? 0) && totalStock > (depositoRow.critical_stock ?? 0)
      : false,
  ).length;

  // ── Mutations ──────────────────────────────────────────────────────────────

  const adjustM = useMutation({
    mutationFn: (data: AdjustStockInput) => api.stock.adjust(data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['stock'] });
      setAdjustTarget(null); setAdjustFresh(false); setAdjustError(null);
      // Also close post-create step if open
      setPostCreate(null); setPostCreateError(null);
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Error inesperado';
      if (postCreate) setPostCreateError(msg);
      else setAdjustError(msg);
    },
  });

  const createRepuestoM = useMutation({
    mutationFn: (data: RepuestoCreateInput) => api.repuestos.create(data),
    onSuccess:  (rep) => {
      qc.invalidateQueries({ queryKey: ['repuestos'] });
      setCreatingRepuesto(false);
      setRepuestoError(null);
      // Offer to add initial stock
      setPostCreate({ id: rep.id, name: rep.name, code: rep.code });
    },
    onError: (err) => setRepuestoError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  const updateRepuestoM = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RepuestoCreateInput }) =>
      api.repuestos.update(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['repuestos'] });
      setEditingRepuestoId(null); setEditError(null);
    },
    onError: (err) => setEditError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  const deleteRepuestoM = useMutation({
    mutationFn: (id: string) => api.repuestos.remove(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['repuestos'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      setDeletingRepuesto(null); setDeleteError(null);
    },
    onError: (err) => setDeleteError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  const setThresholdsM = useMutation({
    mutationFn: (data: SetThresholdsInput) => api.stock.setThresholds(data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['stock'] });
      setEditingThresholds(null); setThresholdsError(null);
    },
    onError: (err) => setThresholdsError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  const isLoading = repuestosQ.isLoading || depositosQ.isLoading || stockQ.isLoading;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-7 pt-7 pb-10">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <KPI value={allRepuestos.length} label="Repuestos" color="#2563eb" />
        <KPI value={allRows.filter((r) => r.totalStock > 0).length} label="Con stock" color="#059669" highlight />
        <KPI value={criticalCount} label="Stock crítico" color="#ef4444" highlight />
        <KPI value={lowCount} label="Stock bajo" color="#f59e0b" highlight />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar repuesto…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-input-bg text-fg text-sm outline-none focus:border-primary"
          />
        </div>

        <select
          value={depositoFilter}
          onChange={(e) => setDepositoFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-input-bg text-fg text-sm outline-none focus:border-primary"
        >
          <option value="">Todos los depósitos</option>
          {(depositosQ.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <button
          onClick={() => setHasStockOnly((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
            hasStockOnly ? 'bg-primary text-white border-primary' : 'bg-card text-fg-muted border-border hover:bg-hover-bg'
          }`}
        >
          Con stock
        </button>

        <span className="text-sm text-fg-subtle">
          {filtered.length} de {allRepuestos.length}
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
              onClick={() => { setAdjustError(null); setAdjustFresh(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
            >
              <Sliders size={14} /> Ajustar stock
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-input-bg border-b border-border">
                <Th>Repuesto</Th>
                <Th align="right">Precio</Th>
                <Th align="right">
                  {selectedDeposito ? `Stock en ${selectedDeposito.name}` : 'Stock total'}
                </Th>
                {depositoFilter && <Th align="right">Mínimo</Th>}
                {depositoFilter && <Th align="right">Crítico</Th>}
                {!depositoFilter && <Th align="right">Depósitos</Th>}
                <Th>Estado</Th>
                {isAdmin && <Th>Acciones</Th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ rep, depositoRow, totalStock, depositoCount }) => {
                const isCritical = depositoFilter && depositoRow && totalStock > 0 && totalStock <= depositoRow.critical_stock;
                const isLow      = depositoFilter && depositoRow && !isCritical && totalStock > 0 && totalStock <= depositoRow.min_stock;
                const isEmpty    = totalStock === 0;
                return (
                  <tr key={rep.id} className="border-b border-border last:border-b-0 hover:bg-hover-bg">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-fg-subtle shrink-0" />
                        <div>
                          <div className="text-[13px] font-semibold text-fg">{rep.name}</div>
                          <div className="text-[11px] text-fg-subtle font-mono">{rep.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] text-fg-muted">
                      ${rep.price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="text-base font-extrabold"
                        style={{
                          color: isCritical ? '#ef4444'
                               : isLow      ? '#f59e0b'
                               : isEmpty    ? 'var(--fg-subtle)'
                               : 'var(--text)',
                        }}
                      >
                        {totalStock}
                      </div>
                      <div className="text-[10px] text-fg-subtle">{rep.unit}</div>
                    </td>
                    {depositoFilter && (
                      <td className="px-4 py-3 text-right text-[13px] text-fg-muted">
                        {depositoRow?.min_stock ?? '—'}
                      </td>
                    )}
                    {depositoFilter && (
                      <td className="px-4 py-3 text-right text-[13px] text-fg-muted">
                        {depositoRow?.critical_stock ?? '—'}
                      </td>
                    )}
                    {!depositoFilter && (
                      <td className="px-4 py-3 text-right text-[13px] text-fg-muted">
                        {depositoCount > 0 ? depositoCount : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <StatusPill
                        critical={!!isCritical}
                        low={!!isLow}
                        empty={isEmpty}
                        noData={!depositoFilter && depositoCount === 0}
                      />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <ActionBtn title="Ajustar stock" onClick={() => {
                            setAdjustError(null);
                            // If deposito filter active + row exists: pre-fill both
                            if (depositoFilter && depositoRow) {
                              setAdjustTarget({ stockRow: depositoRow, lockedRepuesto: null });
                            } else {
                              // Lock only repuesto; user picks deposito
                              setAdjustTarget({ stockRow: null, lockedRepuesto: { id: rep.id, name: rep.name, code: rep.code } });
                            }
                          }}>
                            <Sliders size={13} />
                          </ActionBtn>
                          {depositoFilter && (
                            <ActionBtn title="Umbrales de stock" onClick={() => {
                              setThresholdsError(null);
                              setEditingThresholds({ repuesto: { id: rep.id, name: rep.name, code: rep.code }, stockRow: depositoRow });
                            }}>
                              <BarChart2 size={13} />
                            </ActionBtn>
                          )}
                          <ActionBtn title="Editar repuesto" onClick={() => {
                            setEditError(null);
                            setEditingRepuestoId(rep.id);
                          }}>
                            <Edit2 size={13} />
                          </ActionBtn>
                          <ActionBtn title="Eliminar repuesto" danger onClick={() => {
                            setDeleteError(null);
                            setDeletingRepuesto({ id: rep.id, name: rep.name });
                          }}>
                            <Trash2 size={13} />
                          </ActionBtn>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-fg-subtle text-sm">
                    {isLoading ? 'Cargando…'
                      : search ? 'Sin resultados para la búsqueda.'
                      : hasStockOnly ? 'Sin repuestos con stock.'
                      : 'No hay repuestos. Crea uno con el botón "Nuevo repuesto".'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Adjust stock (per-row or fresh) */}
      <Modal
        open={!!adjustTarget || adjustFresh}
        onClose={() => { setAdjustTarget(null); setAdjustFresh(false); setAdjustError(null); }}
        title={adjustTarget?.stockRow
          ? `Ajustar stock — ${adjustTarget.stockRow.repuesto.code}`
          : adjustTarget?.lockedRepuesto
          ? `Ajustar stock — ${adjustTarget.lockedRepuesto.code}`
          : 'Ajustar stock'}
        maxWidth={460}
      >
        <StockAdjustForm
          initialStock={adjustTarget?.stockRow ?? null}
          lockedRepuesto={adjustTarget?.lockedRepuesto ?? null}
          onSubmit={(data) => adjustM.mutateAsync(data)}
          onCancel={() => { setAdjustTarget(null); setAdjustFresh(false); }}
          busy={adjustM.isPending}
          error={adjustError}
        />
      </Modal>

      {/* Create repuesto — step 1 */}
      <Modal
        open={creatingRepuesto}
        onClose={() => { setCreatingRepuesto(false); setRepuestoError(null); }}
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

      {/* Create repuesto — step 2: add initial stock */}
      <Modal
        open={!!postCreate}
        onClose={() => setPostCreate(null)}
        title="Agregar stock inicial"
        maxWidth={460}
      >
        {postCreate && (
          <div className="space-y-1">
            <p className="text-sm text-fg-muted mb-4">
              Repuesto <span className="font-semibold text-fg">{postCreate.name}</span> creado.
              Podés agregar stock inicial ahora, o hacerlo después desde el inventario.
            </p>
            <StockAdjustForm
              lockedRepuesto={postCreate}
              onSubmit={(data) => adjustM.mutateAsync(data)}
              onCancel={() => setPostCreate(null)}
              busy={adjustM.isPending}
              error={postCreateError}
            />
          </div>
        )}
      </Modal>

      {/* Edit repuesto */}
      <Modal
        open={!!editingRepuestoId}
        onClose={() => { setEditingRepuestoId(null); setEditError(null); }}
        title="Editar repuesto"
        maxWidth={520}
      >
        {editRepuestoQ.data ? (
          <RepuestoForm
            initial={editRepuestoQ.data}
            onCancel={() => setEditingRepuestoId(null)}
            onSubmit={(data) => updateRepuestoM.mutateAsync({ id: editingRepuestoId!, data })}
            busy={updateRepuestoM.isPending}
            error={editError}
          />
        ) : (
          <div className="py-8 text-center text-fg-subtle text-sm">Cargando…</div>
        )}
      </Modal>

      {/* Delete repuesto */}
      <Modal
        open={!!deletingRepuesto}
        onClose={() => { setDeletingRepuesto(null); setDeleteError(null); }}
        title="Eliminar repuesto"
        maxWidth={420}
      >
        <div className="space-y-4">
          <p className="text-sm text-fg-muted">
            ¿Eliminar <span className="font-semibold text-fg">{deletingRepuesto?.name}</span>? Esto
            también eliminará todo el stock y movimientos asociados.
          </p>
          {deleteError && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
              <AlertTriangle size={15} /> {deleteError}
            </div>
          )}
          <div className="flex gap-2 pt-3 border-t border-border">
            <button type="button"
              onClick={() => { setDeletingRepuesto(null); setDeleteError(null); }}
              className="flex-1 py-2.5 rounded-lg bg-bg border border-border text-fg-muted text-sm font-semibold hover:bg-hover-bg">
              Cancelar
            </button>
            <button type="button"
              onClick={() => deletingRepuesto && deleteRepuestoM.mutate(deletingRepuesto.id)}
              disabled={deleteRepuestoM.isPending}
              className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {deleteRepuestoM.isPending ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Thresholds (only available when deposito filter is active) */}
      <Modal
        open={!!editingThresholds}
        onClose={() => { setEditingThresholds(null); setThresholdsError(null); }}
        title="Umbrales de stock"
        maxWidth={400}
      >
        {editingThresholds && (
          <ThresholdsForm
            repuesto={editingThresholds.repuesto}
            stockRow={editingThresholds.stockRow}
            depositoId={depositoFilter}
            depositoName={selectedDeposito?.name ?? ''}
            onSubmit={(min_stock, critical_stock) =>
              setThresholdsM.mutateAsync({
                repuesto_id:    editingThresholds.repuesto.id,
                deposito_id:    depositoFilter,
                min_stock,
                critical_stock,
              })
            }
            onCancel={() => setEditingThresholds(null)}
            busy={setThresholdsM.isPending}
            error={thresholdsError}
          />
        )}
      </Modal>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ThresholdsForm({
  repuesto, stockRow, depositoName, onSubmit, onCancel, busy, error,
}: {
  repuesto: LockedRepuesto;
  stockRow: StockRow | null;
  depositoId: string;
  depositoName: string;
  onSubmit: (min: number, critical: number) => void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const [min, setMin]           = useState(stockRow?.min_stock ?? 0);
  const [critical, setCritical] = useState(stockRow?.critical_stock ?? 0);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(min, critical); }} className="space-y-4">
      <div className="bg-input-bg border border-border rounded-lg p-3">
        <div className="text-sm font-bold text-fg">{repuesto.name}</div>
        <div className="text-xs text-fg-muted">{repuesto.code} · {depositoName}</div>
        <div className="text-xs text-fg-subtle mt-1">
          Stock actual: <span className="font-bold text-fg">{stockRow?.stock ?? 0}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-fg-muted mb-1.5">Stock mínimo</label>
          <input type="number" min={0} value={min}
            onChange={(e) => setMin(parseInt(e.target.value, 10) || 0)}
            className={fCls} />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-fg-muted mb-1.5">Stock crítico</label>
          <input type="number" min={0} value={critical}
            onChange={(e) => setCritical(parseInt(e.target.value, 10) || 0)}
            className={fCls} />
        </div>
      </div>
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
        <button type="submit" disabled={busy}
          className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity ${busy ? 'bg-primary-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'}`}>
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

function ActionBtn({ children, onClick, title, danger }: {
  children: React.ReactNode; onClick: () => void; title: string; danger?: boolean;
}) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        danger
          ? 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-fg-muted hover:text-fg hover:bg-hover-bg'
      }`}>
      {children}
    </button>
  );
}

function KPI({ value, label, color, highlight }: {
  value: number; label: string; color: string; highlight?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card">
      <div className="text-2xl font-extrabold leading-none"
        style={{ color: highlight && value > 0 ? color : 'var(--text)' }}>
        {value}
      </div>
      <div className="text-[11px] text-fg-subtle mt-1">{label}</div>
    </div>
  );
}

function StatusPill({ critical, low, empty, noData }: {
  critical: boolean; low: boolean; empty: boolean; noData: boolean;
}) {
  if (critical) return <span className="inline-flex items-center rounded-full bg-badge-red-bg text-badge-red-fg px-2 py-0.5 text-[11px] font-bold">Crítico</span>;
  if (low)      return <span className="inline-flex items-center rounded-full bg-badge-yellow-bg text-badge-yellow-fg px-2 py-0.5 text-[11px] font-bold">Bajo</span>;
  if (empty)    return <span className="inline-flex items-center rounded-full bg-input-bg text-fg-subtle px-2 py-0.5 text-[11px] font-bold">Sin stock</span>;
  if (noData)   return <span className="inline-flex items-center rounded-full bg-input-bg text-fg-subtle px-2 py-0.5 text-[11px] font-bold">Sin entrada</span>;
  return <span className="inline-flex items-center rounded-full bg-badge-green-bg text-badge-green-fg px-2 py-0.5 text-[11px] font-bold">Normal</span>;
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-2.5 text-${align} text-[10px] font-bold text-fg-subtle uppercase tracking-wider whitespace-nowrap`}>
      {children}
    </th>
  );
}

const fCls = 'w-full px-3 py-2 rounded-lg border-[1.5px] border-border bg-input-bg text-fg text-sm outline-none focus:border-primary';
