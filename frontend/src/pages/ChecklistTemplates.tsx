import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare, ChevronDown, ChevronUp, Edit2, GripVertical,
  Loader2, Plus, Trash2, X,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { Modal } from '../components/Modal';
import type { ChecklistItem, ChecklistTemplate, ChecklistTemplateCreateInput } from '../lib/types';

export function ChecklistTemplates() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChecklistTemplate | null>(null);
  const [filterType, setFilterType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['checklist-templates', filterType],
    queryFn:  () =>
      api.checklists.listTemplates(filterType ? { equipment_type: filterType } : undefined),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.checklists.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });

  const openNew    = () => { setEditing(null);   setShowForm(true); };
  const openEdit   = (t: ChecklistTemplate) => { setEditing(t); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditing(null); };

  return (
    <div className="px-7 pt-7 pb-10">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CheckSquare size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-fg">Plantillas de Checklist</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90"
        >
          <Plus size={15} /> Nueva plantilla
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filtrar por tipo de equipo…"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-input-bg text-fg w-64 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-fg-subtle text-sm">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : !data?.rows.length ? (
        <div className="py-12 text-center text-fg-subtle text-sm">
          No hay plantillas todavía. Creá la primera.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="px-5 py-3 text-left text-[11px] font-bold text-fg-subtle uppercase">Nombre</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-fg-subtle uppercase">Tipo equipo</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-fg-subtle uppercase">Versión</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-fg-subtle uppercase">Items</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-fg-subtle uppercase">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.rows.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-hover-bg">
                  <td className="px-5 py-3 font-semibold text-fg">{t.name}</td>
                  <td className="px-5 py-3 text-fg-muted">{t.equipment_type}</td>
                  <td className="px-5 py-3 text-fg-muted">v{t.version}</td>
                  <td className="px-5 py-3 text-fg-muted">{(t.items as ChecklistItem[]).length}</td>
                  <td className="px-5 py-3">
                    {t.is_active ? (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">Activa</span>
                    ) : (
                      <span className="text-[11px] font-bold text-fg-subtle bg-bg border border-border rounded-full px-2 py-0.5">Inactiva</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded hover:bg-hover-bg text-fg-muted"
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Desactivar la plantilla "${t.name}"?`)) {
                            deleteMut.mutate(t.id);
                          }
                        }}
                        className="p-1.5 rounded hover:bg-hover-bg text-red-500"
                        title="Desactivar"
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal form */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editing ? 'Editar plantilla' : 'Nueva plantilla'}
        maxWidth={680}
      >
        <TemplateForm
          initial={editing}
          onCancel={closeForm}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['checklist-templates'] });
            closeForm();
          }}
        />
      </Modal>
    </div>
  );
}

// ─── Template form ────────────────────────────────────────────────────────────

interface FormProps {
  initial:  ChecklistTemplate | null;
  onCancel: () => void;
  onSaved:  () => void;
}

const ITEM_TYPES = [
  { value: 'boolean', label: 'Sí / No' },
  { value: 'number',  label: 'Número' },
  { value: 'text',    label: 'Texto' },
  { value: 'section', label: 'Sección' },
] as const;

function emptyItem(): ChecklistItem {
  return {
    id:       crypto.randomUUID(),
    label:    '',
    type:     'boolean',
    required: true,
  };
}

function TemplateForm({ initial, onCancel, onSaved }: FormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [equipType, setEquipType] = useState(initial?.equipment_type ?? '');
  const [items, setItems] = useState<ChecklistItem[]>(
    initial?.items.length ? initial.items : [emptyItem()],
  );
  const [error, setError] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: (body: ChecklistTemplateCreateInput) => api.checklists.createTemplate(body),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Error al crear'),
  });

  const updateMut = useMutation({
    mutationFn: (body: Partial<ChecklistTemplateCreateInput>) =>
      api.checklists.updateTemplate(initial!.id, body),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Error al guardar'),
  });

  const busy = createMut.isPending || updateMut.isPending;

  const addItem    = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const moveItem   = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    const tmp = next[idx]!;
    next[idx]    = next[target]!;
    next[target] = tmp;
    setItems(next);
  };
  const patchItem  = <K extends keyof ChecklistItem>(idx: number, key: K, val: ChecklistItem[K]) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  };

  const handleSubmit = () => {
    setError(null);
    const validItems = items.filter((i) => i.label.trim());
    if (!name.trim())         { setError('El nombre es obligatorio'); return; }
    if (!equipType.trim())    { setError('El tipo de equipo es obligatorio'); return; }
    if (!validItems.length)   { setError('Agregá al menos un item'); return; }

    const body: ChecklistTemplateCreateInput = {
      name: name.trim(),
      equipment_type: equipType.trim(),
      items: validItems,
    };

    if (initial) updateMut.mutate(body);
    else         createMut.mutate(body);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Basic fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-1">Nombre *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Ej: Chiller 6 meses"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-1">Tipo de equipo *</label>
          <input
            value={equipType}
            onChange={(e) => setEquipType(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Ej: Chiller"
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-fg-subtle">Items del checklist *</label>
          <button
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:opacity-80"
          >
            <Plus size={13} /> Agregar item
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-start gap-2 bg-bg border border-border rounded-lg p-2"
            >
              <div className="flex flex-col gap-0.5 pt-1">
                <button onClick={() => moveItem(idx, -1)} className="text-fg-subtle hover:text-fg" disabled={idx === 0}>
                  <ChevronUp size={13} />
                </button>
                <GripVertical size={13} className="text-fg-subtle" />
                <button onClick={() => moveItem(idx, 1)} className="text-fg-subtle hover:text-fg" disabled={idx === items.length - 1}>
                  <ChevronDown size={13} />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-3 gap-2">
                {item.type === 'section' ? (
                  /* Section header — just a title, no type/required/unit */
                  <div className="col-span-3 flex items-center gap-2">
                    <input
                      value={item.label}
                      onChange={(e) => patchItem(idx, 'label', e.target.value)}
                      placeholder="Título de sección…"
                      className="flex-1 border-0 border-b-2 border-primary/40 bg-transparent px-1 py-0.5 text-sm font-bold text-primary focus:outline-none focus:border-primary placeholder:font-normal placeholder:text-fg-subtle"
                    />
                    <select
                      value={item.type}
                      onChange={(e) => patchItem(idx, 'type', e.target.value as ChecklistItem['type'])}
                      className="border border-border rounded px-2 py-1 text-xs bg-input-bg text-fg focus:outline-none"
                    >
                      {ITEM_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="col-span-2">
                      <input
                        value={item.label}
                        onChange={(e) => patchItem(idx, 'label', e.target.value)}
                        placeholder="Descripción del item…"
                        className="w-full border border-border rounded px-2 py-1 text-sm bg-input-bg text-fg focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <select
                      value={item.type}
                      onChange={(e) => patchItem(idx, 'type', e.target.value as ChecklistItem['type'])}
                      className="border border-border rounded px-2 py-1 text-sm bg-input-bg text-fg focus:outline-none"
                    >
                      {ITEM_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-3 col-span-2">
                      <label className="flex items-center gap-1.5 text-xs text-fg-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.required ?? false}
                          onChange={(e) => patchItem(idx, 'required', e.target.checked)}
                          className="accent-primary"
                        />
                        Obligatorio
                      </label>
                      {item.type === 'number' && (
                        <input
                          value={item.unit ?? ''}
                          onChange={(e) => patchItem(idx, 'unit', e.target.value || undefined)}
                          placeholder="Unidad (ej: V)"
                          className="border border-border rounded px-2 py-1 text-xs bg-input-bg text-fg focus:outline-none w-24"
                        />
                      )}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => removeItem(idx)}
                className="pt-1 text-red-400 hover:text-red-600"
                disabled={items.length <= 1}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-fg-muted text-sm font-semibold hover:bg-hover-bg"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {initial ? 'Guardar cambios' : 'Crear plantilla'}
        </button>
      </div>
    </div>
  );
}
