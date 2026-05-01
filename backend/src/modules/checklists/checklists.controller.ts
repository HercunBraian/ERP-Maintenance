import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { ChecklistsRepository } from './checklists.repository.js';
import { ChecklistsService } from './checklists.service.js';
import { MantenimientosRepository } from '../mantenimientos/mantenimientos.repository.js';
import type { TemplateCreate, TemplateUpdate, EquipoChecklistIn, SaveAnswers, TemplateListQuery } from './checklists.schemas.js';

const svc = (req: Request) =>
  new ChecklistsService(new ChecklistsRepository(supabaseAsUser(req.accessToken!)));

// ─── Templates ────────────────────────────────────────────────────────────────

export const listTemplates = async (req: Request, res: Response) =>
  res.json(await svc(req).listTemplates(req.query as unknown as TemplateListQuery));

export const getTemplate = async (req: Request, res: Response) =>
  res.json(await svc(req).getTemplate(req.params.id!));

export const createTemplate = async (req: Request, res: Response) =>
  res.status(201).json(await svc(req).createTemplate(req.body as TemplateCreate));

export const updateTemplate = async (req: Request, res: Response) =>
  res.json(await svc(req).updateTemplate(req.params.id!, req.body as TemplateUpdate));

export const deleteTemplate = async (req: Request, res: Response) => {
  await svc(req).deleteTemplate(req.params.id!);
  res.status(204).end();
};

// ─── Equipment ↔ Checklist ────────────────────────────────────────────────────

export const getEquipmentChecklist = async (req: Request, res: Response) =>
  res.json(await svc(req).getEquipmentChecklist(req.params.equipoId!));

export const assignChecklist = async (req: Request, res: Response) =>
  res.status(201).json(
    await svc(req).assignChecklist(req.params.equipoId!, req.body as EquipoChecklistIn),
  );

// ─── Maintenance execution ────────────────────────────────────────────────────

export const getMaintenanceChecklist = async (req: Request, res: Response) =>
  res.json(await svc(req).getMaintenanceChecklist(req.params.id!));

export const saveAnswers = async (req: Request, res: Response) =>
  res.json(await svc(req).saveAnswers(req.params.id!, req.body as SaveAnswers));

export const completeChecklist = async (req: Request, res: Response) =>
  res.json(await svc(req).completeChecklist(req.params.id!));

// ─── PDF ──────────────────────────────────────────────────────────────────────

export const downloadPdf = async (req: Request, res: Response) => {
  const mantId = req.params.id!;
  const db = supabaseAsUser(req.accessToken!);

  const mantRepo  = new MantenimientosRepository(db);
  const mant      = await mantRepo.getById(mantId);
  if (!mant) {
    res.status(404).json({ error: 'NotFound', message: 'Mantenimiento not found' });
    return;
  }

  const checklistRepo = new ChecklistsRepository(db);
  const checklist     = await checklistRepo.getMaintenanceChecklistByMantId(mantId);

  const service  = new ChecklistsService(checklistRepo);
  const pdfBytes = await service.generatePdf({
    equipo:         { model: (mant as any).equipo.model, serial: (mant as any).equipo.serial },
    cliente:        { name:  (mant as any).cliente.name },
    technicianName: (mant as any).technician?.full_name ?? null,
    scheduled_date: mant.scheduled_date as string,
    tipo:           mant.tipo as string,
    notes:          mant.notes as string | null,
    checklist:      checklist ? {
      template_snapshot: checklist.template_snapshot,
      answers:           checklist.answers,
      status:            checklist.status,
      completed_at:      checklist.completed_at,
    } : null,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="mantenimiento-${mantId}.pdf"`);
  res.end(Buffer.from(pdfBytes));
};
