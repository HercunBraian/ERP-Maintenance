import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Boxes, Edit2, Trash2, Package, AlertTriangle, X,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Kit, KitCreateInput } from '../lib/types';
import { Modal } from '../components/Modal';
import { KitForm } from '../components/forms/KitForm';
import { useAuth } from '../contexts/AuthContext';

export function Kits() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Kit | null>(null);
  const [managing, setManaging] = useState<Kit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['kits', 'all'],
    queryFn: () => api.kits.list({ limit: 200 }),
  });

  const createM = useMutation({
    mutationFn: (data: KitCreateInput) => api.kits.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kits'] }); setCreating(false); setError(null); },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });
  const updateM = useMutation({
    mutationFn: (vars: { id: string; data: Partial<KitCreateInput> }) => api.kits.update(vars.id, vars.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kits'] }); setEditing(null); setError(null); },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.kits.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kits'] }),
  });

  return (
    <div className="px-7 pt-7 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Boxes size={20} className="text-primary" />
        <span className="text-sm text-fg-subtle flex-1">{list.data?.total ?? 0} kits</span>
        {isAdmin && (
          <button
            onClick={() => { setError(null); setCreating(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
          >
            <Plus size={15} /> Nuevo kit
          </button>
        )}
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
      >
        {(list.data?.rows ?? []).map((k) => (
          <div key={k.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Boxes size={18} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-fg">{k.code}</div>
                  <div className="text-[11px] text-fg-subtle">{k.equipment_type}</div>
                </div>
              </div>
              <span className="bg-input-bg border border-border rounded-md px-2 py-0.5 text-[11px] font-bold text-fg-muted">
                {k.frequency}
              </span>
            </div>
            <div className="text-[13px] font-semibold text-fg mb-2 leading-snug">{k.name}</div>
            <div className="flex items-center justify-between text-[11px] text-fg-subtle mb-3">
              <span>{k.brand ?? '—'}</span>
              <span>{k.estimated_time_min} min</span>
              <span className="font-bold text-fg">${k.price.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex gap-1.5 pt-3 border-t border-border">
              <button
                onClick={() => setManaging(k)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-bg border border-border rounded-md text-xs text-primary font-semibold hover:bg-hover-bg"
              >
                <Package size={12} /> Repuestos
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => { setError(null); setEditing(k); }}
                    className="px-2.5 py-1.5 bg-bg border border-border rounded-md text-fg-muted hover:bg-hover-bg"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Eliminar este kit?')) deleteM.mutate(k.id);
                    }}
                    className="px-2.5 py-1.5 bg-bg border border-border rounded-md text-red-500 hover:bg-hover-bg"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {(list.data?.rows ?? []).length === 0 && (
          <div className="col-span-full text-center text-fg-subtle py-12">
            No hay kits registrados.
          </div>
        )}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo kit" maxWidth={520}>
        <KitForm
          onCancel={() => setCreating(false)}
          onSubmit={(data) => createM.mutateAsync(data)}
          busy={createM.isPending}
          error={error}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar kit" maxWidth={520}>
        {editing && (
          <KitForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(data) => updateM.mutateAsync({ id: editing.id, data })}
            busy={updateM.isPending}
            error={error}
          />
        )}
      </Modal>

      <KitPartsModal
        kit={managing}
        onClose={() => setManaging(null)}
        canEdit={isAdmin}
      />
    </div>
  );
}

// ─── Sub-resource: kit_repuestos manager ────────────────────────────────────

function KitPartsModal({
  kit, onClose, canEdit,
}: {
  kit: Kit | null;
  onClose: () => void;
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const open = !!kit;

  const detail = useQuery({
    queryKey: ['kit', kit?.id],
    queryFn: () => api.kits.get(kit!.id),
    enabled: open,
  });

  const repuestosQ = useQuery({
    queryKey: ['repuestos', 'all-for-kit-parts'],
    queryFn: () => api.repuestos.list({ limit: 200 }),
    enabled: open && canEdit,
    staleTime: 60_000,
  });

  const [repuestoId, setRepuestoId] = useState('');
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const addM = useMutation({
    mutationFn: () => api.kits.addPart(kit!.id, { repuesto_id: repuestoId, qty }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kit', kit?.id] });
      setRepuestoId(''); setQty(1); setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error'),
  });

  const removeM = useMutation({
    mutationFn: (rid: string) => api.kits.removePart(kit!.id, rid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kit', kit?.id] }),
  });

  const totalCost = useMemo(() => {
    if (!detail.data) return 0;
    return detail.data.parts.reduce((s, p) => s + p.qty * p.repuesto.price, 0);
  }, [detail.data]);

  const submitAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!repuestoId || qty <= 0) return;
    setError(null);
    addM.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title={kit ? `Repuestos de ${kit.code}` : 'Repuestos'} maxWidth={560}>
      {detail.data && (
        <div className="space-y-4">
          <div className="bg-input-bg border border-border rounded-lg p-3">
            <div className="text-sm font-bold text-fg">{detail.data.name}</div>
            <div className="text-xs text-fg-subtle mt-0.5">
              {detail.data.parts.length} repuestos · costo total ${totalCost.toLocaleString('es-AR')}
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {detail.data.parts.length === 0 ? (
              <div className="p-6 text-center text-fg-subtle text-sm">Sin repuestos en este kit.</div>
            ) : (
              detail.data.parts.map((p) => (
                <div key={p.repuesto.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Package size={14} className="text-fg-subtle" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-fg truncate">{p.repuesto.name}</div>
                    <div className="text-[11px] text-fg-subtle">{p.repuesto.code} · {p.repuesto.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-fg">×{p.qty}</div>
                    <div className="text-[10px] text-fg-subtle">
                      ${(p.qty * p.repuesto.price).toLocaleString('es-AR')}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => removeM.mutate(p.repuesto.id)}
                      className="text-fg-subtle hover:text-red-500 p-1"
                      title="Quitar"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {canEdit && (
            <form onSubmit={submitAdd} className="space-y-3 pt-3 border-t border-border">
              <div className="text-xs font-bold text-fg-subtle uppercase tracking-wider">Agregar repuesto</div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={repuestoId}
                  onChange={(e) => setRepuestoId(e.target.value)}
                  className="col-span-2 px-3 py-2 rounded-lg border-[1.5px] border-border bg-input-bg text-fg text-sm outline-none focus:border-primary"
                >
                  <option value="">— Repuesto —</option>
                  {(repuestosQ.data?.rows ?? []).map((r) => (
                    <option key={r.id} value={r.id}>{r.code} · {r.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="px-3 py-2 rounded-lg border-[1.5px] border-border bg-input-bg text-fg text-sm outline-none focus:border-primary text-center"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-badge-red-bg text-badge-red-fg text-xs">
                  <AlertTriangle size={13} /> {error}
                </div>
              )}
              <button
                type="submit"
                disabled={!repuestoId || addM.isPending}
                className={`w-full py-2 rounded-lg text-white text-sm font-semibold transition-opacity ${
                  !repuestoId || addM.isPending ? 'bg-primary-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'
                }`}
              >
                {addM.isPending ? 'Agregando…' : 'Agregar al kit'}
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
