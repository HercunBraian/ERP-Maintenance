import { z } from 'zod';

export const checklistItemSchema = z.object({
  id:       z.string().min(1),
  label:    z.string().min(1),
  type:     z.enum(['boolean', 'number', 'text', 'section']),
  required: z.boolean().optional(),
  unit:     z.string().optional(),
});

export const templateCreateSchema = z.object({
  name:           z.string().min(2).max(200),
  equipment_type: z.string().min(1).max(100),
  items:          z.array(checklistItemSchema).min(1),
});

export const templateUpdateSchema = templateCreateSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const templateListQuerySchema = z.object({
  equipment_type: z.string().optional(),
  is_active:      z.coerce.boolean().optional(),
});

export const equipoChecklistSchema = z.object({
  checklist_template_id: z.string().uuid(),
});

export const saveAnswersSchema = z.object({
  answers: z.record(z.union([z.boolean(), z.number(), z.string(), z.null()])),
});

export const idParamSchema        = z.object({ id:       z.string().uuid() });
export const equipoIdParamSchema  = z.object({ equipoId: z.string().uuid() });

export type TemplateCreate     = z.infer<typeof templateCreateSchema>;
export type TemplateUpdate     = z.infer<typeof templateUpdateSchema>;
export type TemplateListQuery  = z.infer<typeof templateListQuerySchema>;
export type EquipoChecklistIn  = z.infer<typeof equipoChecklistSchema>;
export type SaveAnswers        = z.infer<typeof saveAnswersSchema>;
export type ChecklistItem      = z.infer<typeof checklistItemSchema>;
