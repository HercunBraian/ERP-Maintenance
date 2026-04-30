import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Building2, User, Mail, Phone, Plus, Edit2, Trash2, Cpu,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { ClienteUpdateInput, Mantenimiento } from '../lib/types';
import { StatusBadge, MantTipoBadge } from '../components/badges';
import { Modal } from '../components/Modal';
import { ClienteForm } from '../components/forms/ClienteForm';
import { useAuth } from '../contexts/AuthContext';

export function ClienteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const cliente = useQuery({ queryKey: ['cliente', id], queryFn: () => api.clientes.get(id!), enabled: !!id });
  const equipos = useQuery({
    queryKey: ['equipos', { cliente_id: id }],
    queryFn: () => api.equipos.list({ cliente_id: id, limit: 100 }),
    enabled: !!id,
  });
  const mants = useQuery({
    queryKey: ['mantenimientos', { cliente_id: id }],
    queryFn: () => api.mantenimientos.list({ cliente_id: id, limit: 12 }),
    enabled: !!id,
  });

  const updateM = useMutation({
    mutationFn: (data: ClienteUpdateInput) => api.clientes.update(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cliente', id] });
      qc.invalidateQueries({ queryKey: ['clientes'] });
      setEditing(false);
      setEditError(null);
    },
    onError: (err) => setEditError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  const deleteM = useMutation({
    mutationFn: () => api.clientes.remove(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      navigate('/clientes');
    },
  });

  if (cliente.isLoading) return <Centered>Cargando…</Centered>;
  if (!cliente.data) return <Centered>Cliente no encontrado</Centered>;

  const c = cliente.data;
  const eqs = equipos.data?.rows ?? [];
  const mantsList = mants.data?.rows ?? [];

  return (
    <div className="px-7 pt-7 pb-10">
      <button
        onClick={() => navigate('/clientes')}
        className="flex items-center gap-1 text-primary text-sm font-semibold mb-5 hover:opacity-80"
      >
        <ChevronLeft size={16} /> Volver a Clientes
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-card">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-[14px] bg-primary/15 flex items-center justify-center">
              <Building2 size={26} className="text-primary" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-fg mb-1">{c.name}</div>
              <div className="flex gap-2 items-center">
                <StatusBadge status={c.status} />
                <span className="text-xs text-fg-subtle">Código {c.code}</span>
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditError(null); setEditing(true); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-bg border border-border text-fg-muted rounded-lg text-sm font-semibold hover:bg-hover-bg"
              >
                <Edit2 size={14} /> Editar
              </button>
              <button
                onClick={() => {
                  if (window.confirm('¿Eliminar este cliente? Solo se puede borrar si no tiene equipos asociados.')) {
                    deleteM.mutate();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-bg border border-border text-red-500 rounded-lg text-sm font-semibold hover:bg-hover-bg"
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
          <ContactField icon={User}  label="Contacto" value={c.contact_name} />
          <ContactField icon={Mail}  label="Email"    value={c.email} />
          <ContactField icon={Phone} label="Teléfono" value={c.phone} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Equipos */}
        <Card title={`Equipos (${eqs.length})`}>
          {eqs.length === 0 ? (
            <Empty msg="Este cliente no tiene equipos." />
          ) : (
            eqs.map((e) => (
              <Link
                key={e.id}
                to={`/equipos/${e.id}`}
                className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-hover-bg transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center">
                  <Cpu size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-fg">{e.model}</div>
                  <div className="text-[11px] text-fg-subtle">{e.serial} · {e.type}</div>
                </div>
                <StatusBadge status={e.status} small />
              </Link>
            ))
          )}
        </Card>

        {/* Historial */}
        <Card
          title={`Historial de mantenimientos (${mants.data?.total ?? 0})`}
          headerAction={
            <button
              onClick={() => navigate('/mantenimientos/nuevo')}
              className="flex items-center gap-1 text-primary text-xs font-semibold hover:opacity-80"
            >
              <Plus size={13} /> Nuevo
            </button>
          }
        >
          {mantsList.length === 0 ? (
            <Empty msg="Sin mantenimientos registrados." />
          ) : (
            mantsList.map((m: Mantenimiento) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background:
                      m.status === 'completed' ? '#059669' :
                      m.status === 'overdue'   ? '#ef4444' :
                      m.status === 'in_progress'? '#f59e0b' : '#2563eb',
                  }}
                />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-fg">{m.scheduled_date}</div>
                  <div className="text-[11px] text-fg-subtle">{m.equipo?.model ?? '—'}</div>
                </div>
                <MantTipoBadge tipo={m.tipo} />
              </div>
            ))
          )}
        </Card>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar cliente"
        maxWidth={560}
      >
        <ClienteForm
          initial={c}
          onCancel={() => setEditing(false)}
          onSubmit={(data) => updateM.mutateAsync(data)}
          busy={updateM.isPending}
          error={editError}
        />
      </Modal>
    </div>
  );
}

function ContactField({
  icon: Icon, label, value,
}: { icon: typeof Mail; label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-[13px] text-fg font-medium flex items-center gap-1.5">
        <Icon size={13} className="text-fg-subtle" />
        {value ?? '—'}
      </div>
    </div>
  );
}

function Card({ title, children, headerAction }: { title: string; children: React.ReactNode; headerAction?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <span className="text-sm font-bold text-fg">{title}</span>
        {headerAction}
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="p-8 text-center text-fg-subtle text-sm">{msg}</div>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="h-full flex items-center justify-center text-fg-subtle">{children}</div>;
}
