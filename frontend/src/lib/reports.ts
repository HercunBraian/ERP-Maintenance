import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Cliente, Equipo, Mantenimiento, Alerta, StockRow } from './types';

// ─── Common helpers ──────────────────────────────────────────────────────────

const PRIMARY: [number, number, number] = [37, 99, 235];   // var(--primary)
const RED:     [number, number, number] = [239, 68, 68];
const AMBER:   [number, number, number] = [245, 158, 11];
const GREEN:   [number, number, number] = [5, 150, 105];

const FECHA = () => new Date().toLocaleString('es-AR');

function header(doc: jsPDF, title: string) {
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('MaintenancePro · CMMS', 14, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(title, doc.internal.pageSize.getWidth() - 14, 14, { align: 'right' });
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120);
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.text(`Generado ${FECHA()}`, 14, h - 8);
    doc.text(`Página ${i}/${pages}`, w - 14, h - 8, { align: 'right' });
  }
}

function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}

function downloadXlsx(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

// ─── PDF generators ──────────────────────────────────────────────────────────

export function pdfMantenimientos(rows: Mantenimiento[]) {
  const doc = new jsPDF({ orientation: 'landscape' });
  header(doc, 'Reporte de mantenimientos');

  autoTable(doc, {
    startY: 28,
    head: [['Código', 'Tipo', 'Equipo', 'Cliente', 'Fecha', 'Estado', 'Duración']],
    body: rows.map((m) => [
      m.code,
      m.tipo,
      `${m.equipo?.serial ?? '—'} · ${m.equipo?.model ?? ''}`,
      m.cliente?.name ?? '—',
      m.scheduled_date,
      m.status,
      m.duration_min ? `${m.duration_min} min` : '—',
    ]),
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 5) return;
      const v = String(data.cell.raw);
      if (v === 'completed') data.cell.styles.textColor = GREEN;
      else if (v === 'overdue') data.cell.styles.textColor = RED;
      else if (v === 'in_progress') data.cell.styles.textColor = AMBER;
    },
    styles: { fontSize: 9 },
  });

  footer(doc);
  downloadPdf(doc, `mantenimientos_${Date.now()}.pdf`);
}

export function pdfInventario(rows: StockRow[]) {
  const doc = new jsPDF();
  header(doc, 'Reporte de inventario');

  autoTable(doc, {
    startY: 28,
    head: [['Código', 'Repuesto', 'Depósito', 'Stock', 'Mín.', 'Crítico', 'Estado']],
    body: rows.map((r) => {
      const isCrit = r.stock <= r.critical_stock;
      const isLow = !isCrit && r.stock <= r.min_stock;
      return [
        r.repuesto.code,
        r.repuesto.name,
        r.deposito.name,
        String(r.stock),
        String(r.min_stock),
        String(r.critical_stock),
        isCrit ? 'CRÍTICO' : isLow ? 'BAJO' : 'OK',
      ];
    }),
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 6) return;
      const v = String(data.cell.raw);
      if (v === 'CRÍTICO') {
        data.cell.styles.textColor = RED;
        data.cell.styles.fontStyle = 'bold';
      } else if (v === 'BAJO') data.cell.styles.textColor = AMBER;
      else                     data.cell.styles.textColor = GREEN;
    },
    styles: { fontSize: 9 },
  });

  footer(doc);
  downloadPdf(doc, `inventario_${Date.now()}.pdf`);
}

export function pdfPorCliente(clientes: Cliente[], equipos: Equipo[], mants: Mantenimiento[]) {
  const doc = new jsPDF();
  header(doc, 'Reporte por cliente');

  const rows = clientes.map((c) => {
    const eqs = equipos.filter((e) => e.cliente_id === c.id);
    const mts = mants.filter((m) => m.cliente_id === c.id);
    const overdue = eqs.filter((e) => e.status === 'overdue').length;
    return [
      c.code,
      c.name,
      c.contact_name ?? '—',
      String(eqs.length),
      String(overdue),
      String(mts.filter((m) => m.status === 'completed').length),
      String(mts.filter((m) => m.status === 'scheduled' || m.status === 'in_progress').length),
    ];
  });

  autoTable(doc, {
    startY: 28,
    head: [['Código', 'Cliente', 'Contacto', 'Equipos', 'Vencidos', 'Mant. compl.', 'Mant. pend.']],
    body: rows,
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 4) return;
      if (Number(data.cell.raw) > 0) {
        data.cell.styles.textColor = RED;
        data.cell.styles.fontStyle = 'bold';
      }
    },
    styles: { fontSize: 9 },
  });

  footer(doc);
  downloadPdf(doc, `por_cliente_${Date.now()}.pdf`);
}

export function pdfResumen(opts: {
  equipos: Equipo[];
  mantenimientos: Mantenimiento[];
  alertas: Alerta[];
  stock: StockRow[];
}) {
  const { equipos, mantenimientos, alertas, stock } = opts;
  const doc = new jsPDF();
  header(doc, 'Resumen general');

  // KPI cards as a table
  const kpis: [string, number | string][] = [
    ['Equipos totales',         equipos.length],
    ['Operativos',              equipos.filter((e) => e.status === 'operational').length],
    ['Vencidos',                equipos.filter((e) => e.status === 'overdue').length],
    ['En mantenimiento',        equipos.filter((e) => e.status === 'maintenance').length],
    ['OTs programadas',         mantenimientos.filter((m) => m.status === 'scheduled').length],
    ['OTs completadas',         mantenimientos.filter((m) => m.status === 'completed').length],
    ['OTs en curso',            mantenimientos.filter((m) => m.status === 'in_progress').length],
    ['Alertas activas',         alertas.filter((a) => !a.resolved_at).length],
    ['Alertas críticas',        alertas.filter((a) => a.severity === 'critical' && !a.resolved_at).length],
    ['Repuestos en stock bajo', stock.filter((s) => s.stock <= s.min_stock).length],
  ];

  autoTable(doc, {
    startY: 28,
    head: [['Indicador', 'Valor']],
    body: kpis.map(([k, v]) => [k, String(v)]),
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold', fontSize: 11 } },
    styles: { fontSize: 10 },
  });

  // Distribution by status
  const finalY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 28) + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text('Distribución de equipos por estado', 14, finalY);

  const statuses = ['operational', 'alert', 'overdue', 'maintenance', 'inactive'];
  const total = Math.max(equipos.length, 1);
  autoTable(doc, {
    startY: finalY + 4,
    head: [['Estado', 'Cantidad', '%']],
    body: statuses.map((s) => {
      const count = equipos.filter((e) => e.status === s).length;
      return [s, String(count), `${Math.round((count / total) * 100)}%`];
    }),
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 10 },
  });

  footer(doc);
  downloadPdf(doc, `resumen_${Date.now()}.pdf`);
}

// ─── Excel generators ────────────────────────────────────────────────────────

function autoFitCols(rows: Array<Record<string, unknown>>): { wch: number }[] {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]!);
  return keys.map((k) => ({
    wch: Math.min(
      48,
      Math.max(k.length, ...rows.map((r) => String(r[k] ?? '').length)) + 2,
    ),
  }));
}

export function excelMantenimientos(rows: Mantenimiento[]) {
  const data = rows.map((m) => ({
    Código: m.code,
    Tipo: m.tipo,
    Equipo: m.equipo?.serial ?? '',
    Modelo: m.equipo?.model ?? '',
    Cliente: m.cliente?.name ?? '',
    Fecha: m.scheduled_date,
    Estado: m.status,
    'Duración (min)': m.duration_min ?? '',
    Notas: m.notes ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = autoFitCols(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mantenimientos');
  downloadXlsx(wb, `mantenimientos_${Date.now()}.xlsx`);
}

export function excelInventario(rows: StockRow[]) {
  const data = rows.map((r) => ({
    Código: r.repuesto.code,
    Repuesto: r.repuesto.name,
    Unidad: r.repuesto.unit,
    'Precio unit.': r.repuesto.price,
    Depósito: r.deposito.name,
    Stock: r.stock,
    Mínimo: r.min_stock,
    Crítico: r.critical_stock,
    Estado:
      r.stock <= r.critical_stock ? 'CRÍTICO' :
      r.stock <= r.min_stock ? 'BAJO' : 'OK',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = autoFitCols(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  downloadXlsx(wb, `inventario_${Date.now()}.xlsx`);
}

export function excelCompleto(opts: {
  clientes: Cliente[];
  equipos: Equipo[];
  mantenimientos: Mantenimiento[];
  alertas: Alerta[];
  stock: StockRow[];
}) {
  const wb = XLSX.utils.book_new();

  const clientes = opts.clientes.map((c) => ({
    Código: c.code, Nombre: c.name, Estado: c.status,
    Contacto: c.contact_name ?? '', Email: c.email ?? '', Teléfono: c.phone ?? '',
  }));
  XLSX.utils.book_append_sheet(wb, withFit(XLSX.utils.json_to_sheet(clientes), clientes), 'Clientes');

  const equipos = opts.equipos.map((e) => ({
    Código: e.code, Serie: e.serial, Modelo: e.model, Marca: e.brand, Tipo: e.type,
    Estado: e.status, 'Próximo mant.': e.next_maintenance_date ?? '',
    Cliente: e.cliente?.name ?? '',
  }));
  XLSX.utils.book_append_sheet(wb, withFit(XLSX.utils.json_to_sheet(equipos), equipos), 'Equipos');

  const mants = opts.mantenimientos.map((m) => ({
    Código: m.code, Tipo: m.tipo, Estado: m.status, Fecha: m.scheduled_date,
    Equipo: m.equipo?.serial ?? '', Cliente: m.cliente?.name ?? '',
    'Duración (min)': m.duration_min ?? '',
  }));
  XLSX.utils.book_append_sheet(wb, withFit(XLSX.utils.json_to_sheet(mants), mants), 'Mantenimientos');

  const stock = opts.stock.map((s) => ({
    Código: s.repuesto.code, Repuesto: s.repuesto.name,
    Depósito: s.deposito.name, Stock: s.stock, Mínimo: s.min_stock, Crítico: s.critical_stock,
  }));
  XLSX.utils.book_append_sheet(wb, withFit(XLSX.utils.json_to_sheet(stock), stock), 'Inventario');

  const alertas = opts.alertas.map((a) => ({
    Tipo: a.type, Severidad: a.severity, Mensaje: a.message,
    Resuelto: a.resolved_at ? 'Sí' : 'No', Fecha: a.created_at?.slice(0, 10) ?? '',
  }));
  XLSX.utils.book_append_sheet(wb, withFit(XLSX.utils.json_to_sheet(alertas), alertas), 'Alertas');

  downloadXlsx(wb, `cmms_completo_${Date.now()}.xlsx`);
}

function withFit<T extends Record<string, unknown>>(ws: XLSX.WorkSheet, rows: T[]): XLSX.WorkSheet {
  ws['!cols'] = autoFitCols(rows);
  return ws;
}
