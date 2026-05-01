import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, mapPgError } from '../../lib/errors.js';
import type {
  TemplateCreate,
  TemplateUpdate,
  EquipoChecklistIn,
  SaveAnswers,
  TemplateListQuery,
  ChecklistItem,
} from './checklists.schemas.js';

export class ChecklistsRepository {
  constructor(private readonly db: SupabaseClient) {}

  // ─── Templates ────────────────────────────────────────────────────────────

  async listTemplates(opts: TemplateListQuery) {
    let q = this.db
      .from('checklist_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (opts.equipment_type !== undefined) q = q.eq('equipment_type', opts.equipment_type);
    if (opts.is_active       !== undefined) q = q.eq('is_active',       opts.is_active);

    const { data, error, count } = await q;
    if (error) throw mapPgError(error);
    return { rows: data ?? [], total: count ?? 0 };
  }

  async getTemplate(id: string) {
    const { data, error } = await this.db
      .from('checklist_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return data as {
      id: string; name: string; equipment_type: string; version: number;
      is_active: boolean; items: ChecklistItem[]; created_at: string; updated_at: string;
    } | null;
  }

  async createTemplate(input: TemplateCreate) {
    const { data, error } = await this.db
      .from('checklist_templates')
      .insert(input)
      .select()
      .single();
    if (error) throw mapPgError(error);
    return data;
  }

  async updateTemplate(id: string, patch: TemplateUpdate) {
    const existing = await this.getTemplate(id);
    if (!existing) throw new AppError(404, 'Template not found');

    const update: Record<string, unknown> = {
      ...patch,
      updated_at: new Date().toISOString(),
    };
    // Bump version whenever items change
    if (patch.items) update.version = existing.version + 1;

    const { data, error } = await this.db
      .from('checklist_templates')
      .update(update)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw mapPgError(error);
    if (!data) throw new AppError(404, 'Template not found');
    return data;
  }

  async softDeleteTemplate(id: string) {
    const { error } = await this.db
      .from('checklist_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw mapPgError(error);
  }

  // ─── Equipment ↔ Checklist ────────────────────────────────────────────────

  async getEquipmentChecklist(equipoId: string) {
    const { data, error } = await this.db
      .from('equipment_checklists')
      .select('*, template:checklist_templates(*)')
      .eq('equipo_id', equipoId)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return data;
  }

  async assignChecklist(equipoId: string, input: EquipoChecklistIn) {
    const { data, error } = await this.db
      .from('equipment_checklists')
      .upsert(
        { equipo_id: equipoId, checklist_template_id: input.checklist_template_id },
        { onConflict: 'equipo_id' },
      )
      .select('*, template:checklist_templates(*)')
      .single();
    if (error) throw mapPgError(error);
    return data;
  }

  // ─── Maintenance checklist execution ─────────────────────────────────────

  async getMaintenanceChecklist(id: string) {
    const { data, error } = await this.db
      .from('maintenance_checklists')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return data as {
      id: string; mantenimiento_id: string; template_snapshot: ChecklistItem[];
      answers: Record<string, unknown>; status: string; started_at: string; completed_at: string | null;
    } | null;
  }

  async getMaintenanceChecklistByMantId(mantId: string) {
    const { data, error } = await this.db
      .from('maintenance_checklists')
      .select('*')
      .eq('mantenimiento_id', mantId)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return data as {
      id: string; mantenimiento_id: string; template_snapshot: ChecklistItem[];
      answers: Record<string, unknown>; status: string; started_at: string; completed_at: string | null;
    } | null;
  }

  async createForMaintenance(mantId: string, items: ChecklistItem[]) {
    const { data, error } = await this.db
      .from('maintenance_checklists')
      .insert({
        mantenimiento_id: mantId,
        template_snapshot: items,
        answers: {},
        status: 'in_progress',
      })
      .select()
      .single();
    if (error) throw mapPgError(error);
    return data;
  }

  async mergeAnswers(id: string, newAnswers: Record<string, unknown>) {
    const current = await this.getMaintenanceChecklist(id);
    if (!current) throw new AppError(404, 'Maintenance checklist not found');

    const merged = { ...current.answers, ...newAnswers };

    const { data, error } = await this.db
      .from('maintenance_checklists')
      .update({ answers: merged })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw mapPgError(error);
    if (!data) throw new AppError(404, 'Maintenance checklist not found');
    return data;
  }

  async complete(id: string) {
    const { data, error } = await this.db
      .from('maintenance_checklists')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw mapPgError(error);
    if (!data) throw new AppError(404, 'Maintenance checklist not found');
    return data;
  }
}
