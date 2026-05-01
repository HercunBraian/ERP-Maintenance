import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, Save } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { ChecklistItem } from '../lib/types';

interface Props {
  checklistId: string;
  readonly?:   boolean;
}

export function ChecklistExecution({ checklistId, readonly }: Props) {
  const qc = useQueryClient();

  const { data: checklist, isLoading } = useQuery({
    queryKey: ['maintenance-checklist', checklistId],
    queryFn:  () => api.checklists.getMaintChecklist(checklistId),
    staleTime: 10_000,
  });

  // Local answers state, seeded from server
  const [answers, setAnswers] = useState<Record<string, string | number | boolean | null>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [completeError, setCompleteError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed local state whenever server data arrives
  useEffect(() => {
    if (checklist) {
      setAnswers(checklist.answers as Record<string, string | number | boolean | null>);
    }
  }, [checklist]);

  const saveMut = useMutation({
    mutationFn: (a: Record<string, string | number | boolean | null>) =>
      api.checklists.saveAnswers(checklistId, a),
    onSuccess: () => {
      setSaveStatus('saved');
      qc.invalidateQueries({ queryKey: ['maintenance-checklist', checklistId] });
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => setSaveStatus('error'),
  });

  const completeMut = useMutation({
    mutationFn: () => api.checklists.completeChecklist(checklistId),
    onSuccess: () => {
      setCompleteError(null);
      qc.invalidateQueries({ queryKey: ['maintenance-checklist', checklistId] });
      qc.invalidateQueries({ queryKey: ['mantenimiento'] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details && typeof err.details === 'object') {
        const missing = (err.details as { missing?: string[] }).missing ?? [];
        setCompleteError(
          missing.length
            ? `Faltan items obligatorios: ${missing.length}`
            : err.message,
        );
      } else {
        setCompleteError(err instanceof Error ? err.message : 'Error al completar');
      }
    },
  });

  const handleChange = useCallback(
    (itemId: string, value: string | number | boolean | null) => {
      const next = { ...answers, [itemId]: value };
      setAnswers(next);
      setSaveStatus('saving');

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveMut.mutate(next);
      }, 1500);
    },
    [answers, saveMut],
  );

  const handleManualSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveMut.mutate(answers);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-fg-subtle text-sm">
        <Loader2 size={16} className="animate-spin" /> Cargando checklist…
      </div>
    );
  }

  if (!checklist) return null;

  const items = checklist.template_snapshot as ChecklistItem[];
  const isCompleted = checklist.status === 'completed';
  const isReadonly  = readonly || isCompleted;

  // Progress: required non-section items that have an answer
  const required = items.filter((i) => i.type !== 'section' && i.required);
  const answered = required.filter((i) => {
    const v = answers[i.id];
    return v !== undefined && v !== null && v !== '';
  });
  const pct = required.length > 0 ? Math.round((answered.length / required.length) * 100) : 100;

  return (
    <div>
      {/* Status + progress */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {isCompleted ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
            <CheckCircle2 size={13} /> Completado
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <Clock size={13} /> En progreso
          </span>
        )}
        {!isCompleted && (
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <div className="flex-1 bg-border rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, background: pct === 100 ? '#059669' : '#f59e0b' }}
              />
            </div>
            <span className="text-xs text-fg-subtle whitespace-nowrap">
              {answered.length}/{required.length} obligatorios
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) =>
          item.type === 'section' ? (
            <div key={item.id} className="pt-4 pb-1 first:pt-0">
              <div className="text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b border-primary/20">
                {item.label}
              </div>
            </div>
          ) : (
            <ItemRow
              key={item.id}
              item={item}
              value={answers[item.id] ?? ''}
              onChange={(v) => handleChange(item.id, v)}
              readonly={isReadonly}
            />
          )
        )}
      </div>

      {/* Actions */}
      {!isReadonly && (
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <button
            onClick={handleManualSave}
            disabled={saveMut.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-fg-muted text-sm font-semibold hover:bg-hover-bg disabled:opacity-50"
          >
            {saveMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar
          </button>

          <button
            onClick={() => {
              setCompleteError(null);
              if (window.confirm('¿Marcar el checklist como completado? Esta acción no se puede deshacer.')) {
                completeMut.mutate();
              }
            }}
            disabled={completeMut.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
          >
            {completeMut.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <CheckCircle2 size={14} />}
            Completar
          </button>

          {saveStatus === 'saved'  && <span className="text-xs text-emerald-600">Guardado</span>}
          {saveStatus === 'saving' && <span className="text-xs text-fg-subtle">Guardando…</span>}
          {saveStatus === 'error'  && <span className="text-xs text-red-500">Error al guardar</span>}
          {completeError           && <span className="text-xs text-red-500">{completeError}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Item renderer ────────────────────────────────────────────────────────────

interface ItemRowProps {
  item:     ChecklistItem;
  value:    string | number | boolean | null | '';
  onChange: (v: string | number | boolean | null) => void;
  readonly: boolean;
}

function ItemRow({ item, value, onChange, readonly }: ItemRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm text-fg">{item.label}</span>
          {item.required && <span className="text-[10px] text-red-500 font-bold">*</span>}
          {item.unit && (
            <span className="text-[10px] text-fg-subtle bg-input-bg border border-border rounded px-1">
              {item.unit}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 w-36">
        {item.type === 'boolean' ? (
          readonly ? (
            <span className={`text-sm font-semibold ${
              value === true  ? 'text-emerald-600' :
              value === false ? 'text-red-500' : 'text-fg-subtle'
            }`}>
              {value === true ? 'Sí' : value === false ? 'No' : '—'}
            </span>
          ) : (
            <div className="flex gap-2">
              <ToggleBtn
                active={value === true}
                label="Sí"
                onClick={() => onChange(true)}
                color="green"
              />
              <ToggleBtn
                active={value === false}
                label="No"
                onClick={() => onChange(false)}
                color="red"
              />
            </div>
          )
        ) : item.type === 'number' ? (
          readonly ? (
            <span className="text-sm font-semibold text-fg">
              {value !== '' && value !== null ? `${value}${item.unit ? ' ' + item.unit : ''}` : '—'}
            </span>
          ) : (
            <input
              type="number"
              value={value as number | ''}
              onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-input-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0"
            />
          )
        ) : (
          // text
          readonly ? (
            <span className="text-sm text-fg">{value || '—'}</span>
          ) : (
            <textarea
              rows={2}
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-input-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              placeholder="…"
            />
          )
        )}
      </div>
    </div>
  );
}

function ToggleBtn({
  active, label, onClick, color,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  color: 'green' | 'red';
}) {
  const activeClass =
    color === 'green'
      ? 'bg-emerald-600 text-white border-emerald-600'
      : 'bg-red-500 text-white border-red-500';
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
        active ? activeClass : 'border-border text-fg-muted hover:bg-hover-bg'
      }`}
    >
      {label}
    </button>
  );
}
