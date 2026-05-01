import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users, Shield, Wrench, Lock, Check, AlertTriangle, Edit2, Save, Plus,
  Settings as SettingsIcon, Database, KeyRound, Trash2, Cpu, Tag, Warehouse,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api, ApiError } from '../lib/api';
import type { AppUser, Deposito, EquipmentCategory, EquipmentType, UserCreateInput, UserUpdateInput } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/badges';
import { Modal } from '../components/Modal';

export function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="px-7 pt-7 pb-10 max-w-3xl">
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Lock size={32} className="text-fg-subtle mx-auto mb-3" />
          <h2 className="text-lg font-bold text-fg mb-1">Acceso restringido</h2>
          <p className="text-sm text-fg-muted">
            Solo los administradores pueden acceder a la configuración del sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-7 pt-7 pb-10 max-w-5xl">
      <div className="flex items-center gap-2 mb-5">
        <SettingsIcon className="text-primary" />
        <h1 className="text-lg font-extrabold text-fg">Configuración del sistema</h1>
      </div>

      <UsersSection currentUserId={user!.id} />
      <CatalogSection />
      <SystemSection />
    </div>
  );
}

// ─── Users management ────────────────────────────────────────────────────────

function UsersSection({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [resetting, setResetting] = useState<AppUser | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => api.users.list({ limit: 200 }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const createM = useMutation({
    mutationFn: (data: UserCreateInput) => api.users.create(data),
    onSuccess: () => { invalidate(); setCreating(false); setCreateError(null); },
    onError: (err) => setCreateError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  const roleM = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'technician' }) =>
      api.users.update(id, { role }),
    onSuccess: () => { invalidate(); setRoleError(null); },
    onError: (err) => setRoleError(err instanceof ApiError ? err.message : 'Error'),
  });

  const updateM = useMutation({
    mutationFn: (vars: { id: string; data: UserUpdateInput }) =>
      api.users.update(vars.id, vars.data),
    onSuccess: () => { invalidate(); setEditing(null); setEditError(null); },
    onError: (err) => setEditError(err instanceof ApiError ? err.message : 'Error'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => api.users.remove(id),
    onSuccess: invalidate,
    onError: (err) => alert(err instanceof ApiError ? err.message : 'Error al eliminar'),
  });

  return (
    <Section
      icon={Users}
      title={`Usuarios (${list.data?.total ?? 0})`}
      action={
        <button
          onClick={() => { setCreateError(null); setCreating(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:opacity-90"
        >
          <Plus size={13} /> Nuevo usuario
        </button>
      }
    >
      {roleError && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
          <AlertTriangle size={14} /> {roleError}
        </div>
      )}

      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-input-bg border-y border-border">
              <Th>Usuario</Th>
              <Th>Email</Th>
              <Th>Departamento</Th>
              <Th>Rol</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {(list.data?.rows ?? []).map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={u.avatar ?? u.full_name.slice(0, 2).toUpperCase()} size={32} />
                      <div>
                        <div className="text-[13px] font-bold text-fg">
                          {u.full_name}
                          {isSelf && <span className="ml-1.5 text-[10px] text-primary font-semibold">(vos)</span>}
                        </div>
                        <div className="text-[11px] text-fg-subtle">{u.phone ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-fg-muted truncate max-w-[200px]">{u.email}</td>
                  <td className="px-4 py-3 text-[13px] text-fg-muted">{u.dept ?? '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => roleM.mutate({ id: u.id, role: e.target.value as 'admin' | 'technician' })}
                      disabled={isSelf || roleM.isPending}
                      className={`px-2 py-1 rounded-md border border-border bg-card text-fg text-xs font-semibold outline-none focus:border-primary ${
                        isSelf ? 'opacity-60 cursor-not-allowed' : 'hover:bg-hover-bg'
                      }`}
                      title={isSelf ? 'No podés cambiar tu propio rol' : ''}
                    >
                      <option value="admin">Administrador</option>
                      <option value="technician">Técnico</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn
                        icon={Edit2}
                        title="Editar"
                        onClick={() => { setEditError(null); setEditing(u); }}
                      />
                      <IconBtn
                        icon={KeyRound}
                        title="Reset password"
                        onClick={() => setResetting(u)}
                      />
                      {!isSelf && (
                        <IconBtn
                          icon={Trash2}
                          title="Eliminar usuario"
                          tone="danger"
                          onClick={() => {
                            if (window.confirm(
                              `¿Eliminar a ${u.full_name}?\nEsta acción borra el usuario de Auth + perfil.\n` +
                              'Las OTs y archivos históricos quedan, con técnico = NULL.'
                            )) deleteM.mutate(u.id);
                          }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.isFetched && (list.data?.rows ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-fg-subtle text-sm">
                  Sin usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo usuario"
        maxWidth={520}
      >
        <UserCreateForm
          onCancel={() => setCreating(false)}
          onSubmit={(data) => createM.mutateAsync(data)}
          busy={createM.isPending}
          error={createError}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Editar ${editing.full_name}` : 'Editar usuario'}
        maxWidth={480}
      >
        {editing && (
          <UserEditForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(data) => updateM.mutateAsync({ id: editing.id, data })}
            busy={updateM.isPending}
            error={editError}
          />
        )}
      </Modal>

      {/* Reset password modal */}
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
    </Section>
  );
}

// ─── Forms ───────────────────────────────────────────────────────────────────

function UserCreateForm({
  onCancel, onSubmit, busy, error,
}: {
  onCancel: () => void;
  onSubmit: (data: UserCreateInput) => Promise<unknown> | void;
  busy?: boolean;
  error?: string | null;
}) {
  const [form, setForm] = useState<UserCreateInput>({
    email: '',
    password: '',
    full_name: '',
    role: 'technician',
    dept: '',
    phone: '',
    avatar: '',
  });
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const update = <K extends keyof UserCreateInput>(k: K, v: UserCreateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (form.password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== confirm) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    const clean: UserCreateInput = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      full_name: form.full_name.trim(),
      role: form.role,
    };
    if (form.dept) clean.dept = form.dept;
    if (form.phone) clean.phone = form.phone;
    if (form.avatar) clean.avatar = form.avatar.toUpperCase().slice(0, 2);
    void onSubmit(clean);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre completo" required>
          <input
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            placeholder="Juan Pérez"
            className={inputCls}
            required
          />
        </Field>
        <Field label="Iniciales avatar">
          <input
            value={form.avatar ?? ''}
            onChange={(e) => update('avatar', e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            placeholder="JP"
            className={inputCls + ' uppercase font-bold tracking-widest'}
          />
        </Field>
      </div>

      <Field label="Email" required>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="juan@empresa.com"
          className={inputCls}
          required
          autoComplete="off"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contraseña inicial" required>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={inputCls}
            required
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar contraseña" required>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            required
            autoComplete="new-password"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Rol" required>
          <select
            value={form.role}
            onChange={(e) => update('role', e.target.value as 'admin' | 'technician')}
            className={inputCls}
          >
            <option value="technician">Técnico</option>
            <option value="admin">Administrador</option>
          </select>
        </Field>
        <Field label="Teléfono">
          <input
            value={form.phone ?? ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+54 11 1234-5678"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Departamento">
        <input
          value={form.dept ?? ''}
          onChange={(e) => update('dept', e.target.value)}
          placeholder="Técnicos de campo"
          className={inputCls}
        />
      </Field>

      {(localError || error) && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
          <AlertTriangle size={15} />
          {localError ?? error}
        </div>
      )}

      <div className="bg-input-bg border border-border rounded-lg p-3 text-[11px] text-fg-muted leading-relaxed">
        El usuario se crea con email confirmado automáticamente. Puede iniciar sesión apenas se cree
        usando el email + la contraseña inicial.
      </div>

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
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity ${
            busy ? 'bg-primary-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'
          }`}
        >
          <Plus size={14} /> {busy ? 'Creando…' : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}

function UserEditForm({
  initial, onCancel, onSubmit, busy, error,
}: {
  initial: AppUser;
  onCancel: () => void;
  onSubmit: (data: UserUpdateInput) => Promise<unknown> | void;
  busy?: boolean;
  error?: string | null;
}) {
  const [form, setForm] = useState({
    full_name: initial.full_name ?? '',
    dept: initial.dept ?? '',
    phone: initial.phone ?? '',
    avatar: initial.avatar ?? '',
  });
  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void onSubmit({
      full_name: form.full_name,
      dept: form.dept || null,
      phone: form.phone || null,
      avatar: form.avatar.slice(0, 2).toUpperCase() || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nombre completo" required>
        <input
          value={form.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          className={inputCls}
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Iniciales">
          <input
            value={form.avatar}
            onChange={(e) => update('avatar', e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            className={inputCls + ' uppercase font-bold tracking-widest'}
          />
        </Field>
        <Field label="Teléfono">
          <input
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Departamento">
        <input
          value={form.dept}
          onChange={(e) => update('dept', e.target.value)}
          className={inputCls}
        />
      </Field>

      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
          <AlertTriangle size={15} /> {error}
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
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity ${
            busy ? 'bg-primary-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'
          }`}
        >
          <Save size={14} /> {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordModal({ user, onClose }: { user: AppUser | null; onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: () => api.users.resetPassword(user!.id, pw),
    onSuccess: () => { onClose(); setPw(''); setConfirm(''); setError(null); },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (pw !== confirm) return setError('Las contraseñas no coinciden');
    m.mutate();
  };

  return (
    <Modal open={!!user} onClose={onClose} title={user ? `Reset password — ${user.full_name}` : ''} maxWidth={420}>
      {user && (
        <form onSubmit={submit} className="space-y-4">
          <div className="bg-input-bg border border-border rounded-lg p-3 text-xs text-fg-muted">
            Vas a fijar una nueva contraseña para <strong>{user.email}</strong>.
            El usuario va a poder iniciar sesión con la nueva contraseña inmediatamente.
          </div>
          <Field label="Nueva contraseña" required>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirmar" required>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
              required
            />
          </Field>
          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
              <AlertTriangle size={15} /> {error}
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
              disabled={m.isPending}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity ${
                m.isPending ? 'bg-primary-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'
              }`}
            >
              <KeyRound size={14} /> {m.isPending ? 'Aplicando…' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─── Catalog (equipment types, categories, depositos) ────────────────────────

function CatalogSection() {
  const qc = useQueryClient();

  // ── Equipment Types ──────────────────────────────────────────────────────
  const typesQ = useQuery({
    queryKey: ['catalog', 'equipment-types'],
    queryFn:  () => api.catalog.listEquipmentTypes(),
  });
  const [newType, setNewType] = useState('');
  const createTypeM = useMutation({
    mutationFn: (name: string) => api.catalog.createEquipmentType(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalog', 'equipment-types'] }); setNewType(''); },
  });
  const deleteTypeM = useMutation({
    mutationFn: (id: string) => api.catalog.deleteEquipmentType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'equipment-types'] }),
  });

  // ── Equipment Categories ─────────────────────────────────────────────────
  const catsQ = useQuery({
    queryKey: ['catalog', 'equipment-categories'],
    queryFn:  () => api.catalog.listEquipmentCategories(),
  });
  const [newCat, setNewCat] = useState('');
  const createCatM = useMutation({
    mutationFn: (name: string) => api.catalog.createEquipmentCategory(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalog', 'equipment-categories'] }); setNewCat(''); },
  });
  const deleteCatM = useMutation({
    mutationFn: (id: string) => api.catalog.deleteEquipmentCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'equipment-categories'] }),
  });

  // ── Depositos ────────────────────────────────────────────────────────────
  const deposQ = useQuery({
    queryKey: ['catalog', 'depositos'],
    queryFn:  () => api.depositos.list(),
  });
  const [newDeposito, setNewDeposito] = useState({ code: '', name: '', address: '' });
  const [editDeposito, setEditDeposito] = useState<Deposito | null>(null);
  const createDepositoM = useMutation({
    mutationFn: () => api.depositos.create({
      code: newDeposito.code,
      name: newDeposito.name,
      address: newDeposito.address || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'depositos'] });
      setNewDeposito({ code: '', name: '', address: '' });
    },
  });
  const updateDepositoM = useMutation({
    mutationFn: (d: Deposito) => api.depositos.update(d.id, { code: d.code, name: d.name, address: d.address ?? undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalog', 'depositos'] }); setEditDeposito(null); },
  });
  const deleteDepositoM = useMutation({
    mutationFn: (id: string) => api.depositos.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'depositos'] }),
  });

  const submitNewDeposito = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeposito.code.trim() || !newDeposito.name.trim()) return;
    createDepositoM.mutate();
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-card mb-5 overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Database size={15} className="text-primary" />
          <span className="text-sm font-bold text-fg">Catálogos del sistema</span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Equipment Types */}
        <CatalogList
          icon={Cpu}
          title="Tipos de equipo"
          items={(typesQ.data ?? []) as EquipmentType[]}
          onDelete={(id) => deleteTypeM.mutate(id)}
          deleteBusy={deleteTypeM.isPending}
          addSlot={
            <form
              onSubmit={(e) => { e.preventDefault(); if (newType.trim()) createTypeM.mutate(newType.trim()); }}
              className="flex gap-1.5 mt-3"
            >
              <input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Ej: Compresor"
                className={inputCls + ' text-xs py-1.5'}
              />
              <button
                type="submit"
                disabled={createTypeM.isPending || !newType.trim()}
                className="flex-shrink-0 px-2.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                <Plus size={13} />
              </button>
            </form>
          }
        />

        {/* Equipment Categories */}
        <CatalogList
          icon={Tag}
          title="Categorías"
          items={(catsQ.data ?? []) as EquipmentCategory[]}
          onDelete={(id) => deleteCatM.mutate(id)}
          deleteBusy={deleteCatM.isPending}
          addSlot={
            <form
              onSubmit={(e) => { e.preventDefault(); if (newCat.trim()) createCatM.mutate(newCat.trim()); }}
              className="flex gap-1.5 mt-3"
            >
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Ej: Neumática"
                className={inputCls + ' text-xs py-1.5'}
              />
              <button
                type="submit"
                disabled={createCatM.isPending || !newCat.trim()}
                className="flex-shrink-0 px-2.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                <Plus size={13} />
              </button>
            </form>
          }
        />

        {/* Depositos */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Warehouse size={14} className="text-primary" />
            <span className="text-xs font-bold text-fg-subtle uppercase tracking-wider">Depósitos</span>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {(deposQ.data ?? []).map((d) => (
              editDeposito?.id === d.id ? (
                /* Inline edit row */
                <div key={d.id} className="flex flex-col gap-1 bg-input-bg border border-primary/40 rounded-lg p-2">
                  <div className="flex gap-1">
                    <input
                      value={editDeposito.code}
                      onChange={(e) => setEditDeposito({ ...editDeposito, code: e.target.value })}
                      className={inputCls + ' text-xs py-1 w-20'}
                      placeholder="Código"
                    />
                    <input
                      value={editDeposito.name}
                      onChange={(e) => setEditDeposito({ ...editDeposito, name: e.target.value })}
                      className={inputCls + ' text-xs py-1 flex-1'}
                      placeholder="Nombre"
                    />
                  </div>
                  <input
                    value={editDeposito.address ?? ''}
                    onChange={(e) => setEditDeposito({ ...editDeposito, address: e.target.value })}
                    className={inputCls + ' text-xs py-1'}
                    placeholder="Dirección (opcional)"
                  />
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setEditDeposito(null)} className="text-xs text-fg-muted px-2 py-1 hover:bg-hover-bg rounded">Cancelar</button>
                    <button
                      onClick={() => updateDepositoM.mutate(editDeposito)}
                      disabled={updateDepositoM.isPending}
                      className="text-xs bg-primary text-white px-2 py-1 rounded font-semibold disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div key={d.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-input-bg border border-border rounded-lg group">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-fg-subtle mr-1.5">{d.code}</span>
                    <span className="text-xs text-fg truncate">{d.name}</span>
                    {d.address && <div className="text-[10px] text-fg-subtle truncate">{d.address}</div>}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditDeposito(d)} className="p-1 rounded hover:bg-hover-bg text-fg-muted">
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`¿Eliminar depósito "${d.name}"?`)) deleteDepositoM.mutate(d.id); }}
                      className="p-1 rounded hover:bg-hover-bg text-red-400"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )
            ))}
            {deposQ.isFetched && (deposQ.data ?? []).length === 0 && (
              <p className="text-xs text-fg-subtle py-2">Sin depósitos todavía.</p>
            )}
          </div>

          <form onSubmit={submitNewDeposito} className="mt-3 space-y-1.5">
            <div className="flex gap-1">
              <input
                value={newDeposito.code}
                onChange={(e) => setNewDeposito((p) => ({ ...p, code: e.target.value }))}
                placeholder="Código"
                className={inputCls + ' text-xs py-1.5 w-20'}
              />
              <input
                value={newDeposito.name}
                onChange={(e) => setNewDeposito((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre"
                className={inputCls + ' text-xs py-1.5 flex-1'}
              />
            </div>
            <div className="flex gap-1">
              <input
                value={newDeposito.address}
                onChange={(e) => setNewDeposito((p) => ({ ...p, address: e.target.value }))}
                placeholder="Dirección (opcional)"
                className={inputCls + ' text-xs py-1.5 flex-1'}
              />
              <button
                type="submit"
                disabled={createDepositoM.isPending || !newDeposito.code.trim() || !newDeposito.name.trim()}
                className="flex-shrink-0 px-2.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                <Plus size={13} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

function CatalogList({
  icon: Icon, title, items, onDelete, deleteBusy, addSlot,
}: {
  icon: typeof Cpu;
  title: string;
  items: Array<{ id: string; name: string }>;
  onDelete: (id: string) => void;
  deleteBusy: boolean;
  addSlot: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Icon size={14} className="text-primary" />
        <span className="text-xs font-bold text-fg-subtle uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
        {items.map((item) => (
          <span
            key={item.id}
            className="flex items-center gap-1 bg-input-bg border border-border rounded-full px-2.5 py-1 text-xs text-fg group"
          >
            {item.name}
            <button
              onClick={() => { if (window.confirm(`¿Eliminar "${item.name}"?`)) onDelete(item.id); }}
              disabled={deleteBusy}
              className="text-fg-subtle hover:text-red-500 transition-colors ml-0.5"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        {items.length === 0 && <p className="text-xs text-fg-subtle py-1">Sin registros todavía.</p>}
      </div>
      {addSlot}
    </div>
  );
}

// ─── System info ─────────────────────────────────────────────────────────────

function SystemSection() {
  const counts = useQuery({
    queryKey: ['settings', 'system-counts'],
    queryFn: async () => {
      const tables = ['clientes', 'equipos', 'mantenimientos', 'repuestos', 'kits', 'alertas'] as const;
      const out: Record<string, number> = {};
      await Promise.all(tables.map(async (t) => {
        const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
        out[t] = count ?? 0;
      }));
      return out;
    },
  });

  return (
    <Section icon={Database} title="Estado del sistema">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(counts.data ?? {}).map(([k, v]) => (
          <div key={k} className="bg-input-bg border border-border rounded-lg p-3">
            <div className="text-2xl font-extrabold text-fg leading-none">{v}</div>
            <div className="text-[11px] text-fg-subtle mt-1 capitalize">{k}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-fg-muted">
        <div className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> Realtime activo en equipos, mantenimientos, alertas, stock</div>
        <div className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> RLS habilitado en las 14 tablas</div>
        <div className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> RPCs atómicas: <code>consume_part</code>, <code>adjust_stock</code>, <code>get_equipo_by_qr</code></div>
      </div>
    </Section>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg border-[1.5px] border-border bg-input-bg text-fg text-sm outline-none focus:border-primary';

function Section({
  icon: Icon, title, action, children,
}: {
  icon: typeof Users; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card mb-5 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-primary" />
          <span className="text-sm font-bold text-fg">{title}</span>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

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

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-2.5 text-${align} text-[10px] font-bold text-fg-subtle uppercase tracking-wider whitespace-nowrap`}>
      {children}
    </th>
  );
}

function IconBtn({
  icon: Icon, title, onClick, tone,
}: { icon: typeof Edit2; title: string; onClick: () => void; tone?: 'danger' }) {
  const cls = tone === 'danger'
    ? 'text-red-500 hover:bg-red-50'
    : 'text-fg-muted hover:bg-hover-bg hover:text-primary';
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors ${cls}`}>
      <Icon size={14} />
    </button>
  );
}

// keep unused-import linter happy when icons are conditionally rendered elsewhere
void Shield; void Wrench;
