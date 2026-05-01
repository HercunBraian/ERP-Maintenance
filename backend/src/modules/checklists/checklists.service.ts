import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AppError } from '../../lib/errors.js';
import type { ChecklistsRepository, } from './checklists.repository.js';
import type {
  TemplateCreate,
  TemplateUpdate,
  EquipoChecklistIn,
  SaveAnswers,
  TemplateListQuery,
  ChecklistItem,
} from './checklists.schemas.js';

const TIPO_LABELS: Record<string, string> = {
  'preventive-6m':  'Preventivo 6 meses',
  'preventive-12m': 'Preventivo 12 meses',
  'corrective':     'Correctivo',
  'use-based':      'Por uso',
};

interface PdfData {
  equipo:        { model: string; serial: string };
  cliente:       { name: string };
  technicianName?: string | null;
  scheduled_date: string;
  tipo:           string;
  notes?:         string | null;
  checklist?:     {
    template_snapshot: ChecklistItem[];
    answers:           Record<string, unknown>;
    status:            string;
    completed_at:      string | null;
  } | null;
}

export class ChecklistsService {
  constructor(private readonly repo: ChecklistsRepository) {}

  // ─── Templates ────────────────────────────────────────────────────────────

  listTemplates(opts: TemplateListQuery) {
    return this.repo.listTemplates(opts);
  }

  async getTemplate(id: string) {
    const t = await this.repo.getTemplate(id);
    if (!t) throw new AppError(404, 'Template not found');
    return t;
  }

  createTemplate(input: TemplateCreate) {
    return this.repo.createTemplate(input);
  }

  updateTemplate(id: string, patch: TemplateUpdate) {
    return this.repo.updateTemplate(id, patch);
  }

  async deleteTemplate(id: string) {
    const t = await this.repo.getTemplate(id);
    if (!t) throw new AppError(404, 'Template not found');
    return this.repo.softDeleteTemplate(id);
  }

  // ─── Equipment assignment ─────────────────────────────────────────────────

  getEquipmentChecklist(equipoId: string) {
    return this.repo.getEquipmentChecklist(equipoId);
  }

  assignChecklist(equipoId: string, input: EquipoChecklistIn) {
    return this.repo.assignChecklist(equipoId, input);
  }

  // ─── Maintenance execution ────────────────────────────────────────────────

  async getMaintenanceChecklist(id: string) {
    const c = await this.repo.getMaintenanceChecklist(id);
    if (!c) throw new AppError(404, 'Maintenance checklist not found');
    return c;
  }

  async saveAnswers(id: string, input: SaveAnswers) {
    const c = await this.repo.getMaintenanceChecklist(id);
    if (!c) throw new AppError(404, 'Maintenance checklist not found');
    if (c.status === 'completed')
      throw new AppError(409, 'Checklist already completed', 'AlreadyCompleted');
    return this.repo.mergeAnswers(id, input.answers as Record<string, unknown>);
  }

  async completeChecklist(id: string) {
    const c = await this.repo.getMaintenanceChecklist(id);
    if (!c) throw new AppError(404, 'Maintenance checklist not found');
    if (c.status === 'completed')
      throw new AppError(409, 'Already completed', 'AlreadyCompleted');

    const items = c.template_snapshot as ChecklistItem[];
    const answers = c.answers as Record<string, unknown>;
    const missing = items
      .filter((item) => item.type !== 'section' && item.required)
      .filter((item) => {
        const v = answers[item.id];
        return v === undefined || v === null || v === '';
      })
      .map((item) => item.id);

    if (missing.length > 0)
      throw new AppError(400, 'Missing required checklist items', 'MissingAnswers', { missing });

    return this.repo.complete(id);
  }

  // ─── PDF generation ───────────────────────────────────────────────────────

  async generatePdf(data: PdfData): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const fontNorm = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    let page = doc.addPage([595.28, 841.89]);
    let y = 800;
    const L = 50;
    const R = 545;

    function guard(needed: number) {
      if (y - needed < 50) {
        page = doc.addPage([595.28, 841.89]);
        y = 800;
      }
    }

    function hr() {
      guard(14);
      page.drawLine({
        start: { x: L, y },
        end:   { x: R, y },
        thickness: 0.5,
        color: rgb(0.75, 0.75, 0.75),
      });
      y -= 14;
    }

    function row(label: string, value: string) {
      guard(16);
      page.drawText(label, { x: L, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
      page.drawText((value ?? '').slice(0, 72), { x: L + 130, y, size: 10, font: fontNorm, color: rgb(0.15, 0.15, 0.15) });
      y -= 16;
    }

    // Title
    guard(30);
    page.drawText('REPORTE DE MANTENIMIENTO', {
      x: L, y, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.5),
    });
    y -= 28;
    hr();

    // Info fields
    row('Equipo:',    `${data.equipo.model} / ${data.equipo.serial}`);
    row('Cliente:',   data.cliente.name);
    row('Técnico:',   data.technicianName ?? '—');
    row('Fecha:',     data.scheduled_date);
    row('Tipo:',      TIPO_LABELS[data.tipo] ?? data.tipo);
    if (data.notes) row('Observaciones:', data.notes);
    y -= 4;
    hr();

    if (data.checklist) {
      const { template_snapshot, answers, status } = data.checklist;

      guard(26);
      page.drawText('CHECKLIST', { x: L, y, size: 13, font: fontBold, color: rgb(0, 0, 0) });
      const statusLabel = status === 'completed' ? 'COMPLETADO' : 'EN PROGRESO';
      const statusColor = status === 'completed' ? rgb(0, 0.5, 0.1) : rgb(0.8, 0.45, 0);
      page.drawText(statusLabel, { x: R - 95, y, size: 10, font: fontBold, color: statusColor });
      y -= 22;

      const items = template_snapshot as ChecklistItem[];
      const ans   = answers as Record<string, unknown>;

      for (const item of items) {
        if (item.type === 'section') {
          guard(22);
          y -= 4;
          page.drawText(item.label.slice(0, 70), {
            x: L + 8, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.5),
          });
          y -= 4;
          page.drawLine({
            start: { x: L + 8, y }, end: { x: R, y },
            thickness: 0.4, color: rgb(0.7, 0.7, 0.9),
          });
          y -= 12;
          continue;
        }
        guard(16);
        const raw = ans[item.id];
        let valStr = '—';
        if (raw !== undefined && raw !== null && raw !== '') {
          valStr = item.type === 'boolean'
            ? (raw ? 'Sí' : 'No')
            : `${raw}${item.unit ? ' ' + item.unit : ''}`;
        }
        const prefix = item.required ? '• ' : '  ';
        page.drawText(`${prefix}${item.label}`.slice(0, 55), {
          x: L + 8, y, size: 9.5, font: fontNorm, color: rgb(0.1, 0.1, 0.1),
        });
        page.drawText(valStr.slice(0, 25), {
          x: R - 95, y, size: 9.5,
          font: (raw !== undefined && raw !== null && raw !== '') ? fontBold : fontNorm,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= 15;
      }

      y -= 4;
      hr();

      if (data.checklist.completed_at) {
        guard(14);
        page.drawText(
          `Completado el ${new Date(data.checklist.completed_at).toLocaleDateString('es-AR')}`,
          { x: L, y, size: 8, font: fontNorm, color: rgb(0.5, 0.5, 0.5) },
        );
        y -= 14;
      }
    } else {
      guard(16);
      page.drawText('Sin checklist asociado.', {
        x: L, y, size: 10, font: fontNorm, color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Footer — always on the last page that exists
    page.drawText(
      `ERP Mantenimiento · Generado ${new Date().toLocaleDateString('es-AR')}`,
      { x: L, y: 28, size: 8, font: fontNorm, color: rgb(0.6, 0.6, 0.6) },
    );

    return doc.save();
  }
}
