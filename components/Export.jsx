
const { useState: useStateExp, useCallback: useCallbackExp } = React;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const PRIMARY = [37, 99, 235];      // #2563eb
const DARK    = [15, 23, 42];       // #0f172a
const GRAY    = [100, 116, 139];    // #64748b
const LIGHT   = [241, 245, 249];    // #f1f5f9
const GREEN   = [5, 150, 105];
const RED     = [220, 38, 38];
const YELLOW  = [245, 158, 11];
const BLUE    = [2, 132, 199];

const STATUS_LABELS = {
  operational:'Operativo', alert:'Alerta', overdue:'Vencido',
  maintenance:'En mant.', inactive:'Inactivo',
  scheduled:'Programado', completed:'Completado',
  'in-progress':'En progreso', active:'Activo',
};
const TYPE_LABELS = {
  'preventive-6m':'Preventivo 6M', 'preventive-12m':'Preventivo 12M',
  corrective:'Correctivo', 'use-based':'Por uso',
};

function statusColor(s) {
  if (s === 'operational' || s === 'completed' || s === 'active') return GREEN;
  if (s === 'overdue') return RED;
  if (s === 'alert' || s === 'in-progress') return YELLOW;
  if (s === 'scheduled' || s === 'maintenance') return BLUE;
  return GRAY;
}

function waitForLib(check, cb, tries = 0) {
  if (check()) { cb(); return; }
  if (tries > 50) { console.warn('Library not loaded'); return; }
  setTimeout(() => waitForLib(check, cb, tries + 1), 100);
}

const today = () => new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });

// ─── PDF HELPERS ──────────────────────────────────────────────────────────────
function pdfHeader(doc, title, subtitle) {
  const W = doc.internal.pageSize.getWidth();
  // Blue header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 22, 'F');
  // Logo area
  doc.setFillColor(255, 255, 255, 0.2);
  doc.roundedRect(8, 5, 28, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text('CMMS', 22, 13, { align: 'center' });
  // Title
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(title, 42, 10);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(subtitle || 'MaintenancePro ERP/CMMS', 42, 16);
  // Date
  doc.setFontSize(7);
  doc.text(`Generado: ${today()}`, W - 10, 10, { align: 'right' });
  doc.text('MaintenancePro v2.4', W - 10, 16, { align: 'right' });
}

function pdfFooter(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.3);
    doc.line(10, H - 12, W - 10, H - 12);
    doc.setTextColor(...GRAY);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('MaintenancePro ERP/CMMS — Confidencial', 10, H - 7);
    doc.text(`Pág. ${i} / ${total}`, W - 10, H - 7, { align: 'right' });
  }
}

function sectionTitle(doc, text, y) {
  doc.setFillColor(...LIGHT);
  doc.rect(10, y - 4, doc.internal.pageSize.getWidth() - 20, 7, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text(text, 13, y + 1);
  return y + 8;
}

// ─── PDF: RESUMEN GENERAL ─────────────────────────────────────────────────────
function exportSummaryPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  pdfHeader(doc, 'Reporte General', 'Resumen ejecutivo del sistema');

  // KPI boxes row
  const kpis = [
    { label: 'Clientes activos', value: data.clients.filter(c=>c.status==='active').length, color: PRIMARY },
    { label: 'Equipos totales', value: data.equipment.length, color: GREEN },
    { label: 'Mantenimientos vencidos', value: data.maintenances.filter(m=>m.status==='overdue').length, color: RED },
    { label: 'Mantenimientos completados', value: data.maintenances.filter(m=>m.status==='completed').length, color: BLUE },
  ];
  const boxW = (W - 20 - 9) / 4;
  kpis.forEach((k, i) => {
    const x = 10 + i * (boxW + 3);
    doc.setFillColor(...k.color);
    doc.roundedRect(x, 28, boxW, 18, 2, 2, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text(String(k.value), x + boxW/2, 40, { align: 'center' });
    doc.setFontSize(6); doc.setFont('helvetica', 'normal');
    doc.text(k.label, x + boxW/2, 44, { align: 'center' });
  });

  let y = 54;
  y = sectionTitle(doc, 'Estado de equipos', y);
  doc.autoTable({
    startY: y,
    margin: { left: 10, right: 10 },
    head: [['Estado', 'Cantidad', '%']],
    body: [
      ['Operativo', data.equipment.filter(e=>e.status==='operational').length, `${Math.round(data.equipment.filter(e=>e.status==='operational').length/data.equipment.length*100)}%`],
      ['Con alerta', data.equipment.filter(e=>e.status==='alert').length, `${Math.round(data.equipment.filter(e=>e.status==='alert').length/data.equipment.length*100)}%`],
      ['Mantenimiento vencido', data.equipment.filter(e=>e.status==='overdue').length, `${Math.round(data.equipment.filter(e=>e.status==='overdue').length/data.equipment.length*100)}%`],
      ['En mantenimiento', data.equipment.filter(e=>e.status==='maintenance').length, `${Math.round(data.equipment.filter(e=>e.status==='maintenance').length/data.equipment.length*100)}%`],
    ],
    headStyles: { fillColor: PRIMARY, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    tableLineColor: [226,232,240], tableLineWidth: 0.2,
  });

  y = doc.lastAutoTable.finalY + 8;
  y = sectionTitle(doc, 'Distribución por tipo de mantenimiento', y);
  const typeRows = [
    ['Preventivo 6 meses', data.maintenances.filter(m=>m.type==='preventive-6m').length],
    ['Preventivo 12 meses', data.maintenances.filter(m=>m.type==='preventive-12m').length],
    ['Correctivo', data.maintenances.filter(m=>m.type==='corrective').length],
    ['Por uso', data.maintenances.filter(m=>m.type==='use-based').length],
  ];
  doc.autoTable({
    startY: y,
    margin: { left: 10, right: 10 },
    head: [['Tipo', 'Total']],
    body: typeRows,
    headStyles: { fillColor: PRIMARY, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    tableLineColor: [226,232,240], tableLineWidth: 0.2,
  });

  pdfFooter(doc);
  doc.save(`Reporte-General-${today().replace(/\//g,'-')}.pdf`);
}

// ─── PDF: MANTENIMIENTOS ──────────────────────────────────────────────────────
function exportMaintenancesPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  pdfHeader(doc, 'Reporte de Mantenimientos', `Total: ${data.maintenances.length} registros`);

  const rows = data.maintenances.map(m => {
    const eq = data.equipment.find(e=>e.id===m.equipmentId);
    const cl = data.clients.find(c=>c.id===m.clientId);
    const tech = data.users.find(u=>u.id===m.technicianId);
    return [
      m.date,
      eq?.serial || '—',
      eq?.model || '—',
      cl?.name || '—',
      TYPE_LABELS[m.type] || m.type,
      STATUS_LABELS[m.status] || m.status,
      tech?.name || 'Sin asignar',
      m.duration ? `${m.duration} min` : '—',
      m.notes ? m.notes.substring(0,50) + (m.notes.length>50?'...':'') : '—',
    ];
  });

  doc.autoTable({
    startY: 28,
    margin: { left: 10, right: 10 },
    head: [['Fecha','Serie','Modelo','Cliente','Tipo','Estado','Técnico','Duración','Observaciones']],
    body: rows,
    headStyles: { fillColor: PRIMARY, textColor:[255,255,255], fontStyle:'bold', fontSize:7.5 },
    bodyStyles: { fontSize: 7, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    tableLineColor: [226,232,240], tableLineWidth: 0.2,
    columnStyles: { 8: { cellWidth: 45 } },
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 5) {
        const sc = statusColor(data.maintenances[d.row.index]?.status);
        d.cell.styles.textColor = sc;
        d.cell.styles.fontStyle = 'bold';
      }
    },
  });

  pdfFooter(doc);
  doc.save(`Mantenimientos-${today().replace(/\//g,'-')}.pdf`);
}

// ─── PDF: INVENTARIO ──────────────────────────────────────────────────────────
function exportInventoryPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  pdfHeader(doc, 'Reporte de Inventario', `${data.parts.length} repuestos registrados`);

  const rows = data.parts.map(p => {
    const s = p.stock === 0 ? 'critical' : p.stock <= p.criticalStock ? 'critical' : p.stock <= p.minStock ? 'low' : 'normal';
    return [p.code, p.name, p.depot, p.stock, p.minStock, p.criticalStock, s === 'critical' ? 'CRÍTICO' : s === 'low' ? 'BAJO' : 'Normal', `$${p.price.toLocaleString('es-AR')}`];
  });

  doc.autoTable({
    startY: 28,
    margin: { left: 10, right: 10 },
    head: [['Código','Nombre','Depósito','Stock','Mín.','Crít.','Estado','Precio']],
    body: rows,
    headStyles: { fillColor: PRIMARY, textColor:[255,255,255], fontStyle:'bold', fontSize:8 },
    bodyStyles: { fontSize: 7.5, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    tableLineColor: [226,232,240], tableLineWidth: 0.2,
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 6) {
        const val = d.cell.raw;
        d.cell.styles.textColor = val === 'CRÍTICO' ? RED : val === 'BAJO' ? YELLOW : GREEN;
        d.cell.styles.fontStyle = 'bold';
      }
    },
  });

  pdfFooter(doc);
  doc.save(`Inventario-${today().replace(/\//g,'-')}.pdf`);
}

// ─── PDF: POR CLIENTE ─────────────────────────────────────────────────────────
function exportClientsPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  pdfHeader(doc, 'Reporte por Cliente', `${data.clients.length} clientes`);

  const rows = data.clients.map(cl => {
    const eqs = data.equipment.filter(e=>e.clientId===cl.id);
    const ms = data.maintenances.filter(m=>m.clientId===cl.id);
    return [
      cl.name, cl.contact, cl.email,
      STATUS_LABELS[cl.status] || cl.status,
      eqs.length,
      eqs.filter(e=>e.status==='operational').length,
      eqs.filter(e=>e.status==='overdue').length,
      ms.length,
      ms.filter(m=>m.status==='completed').length,
    ];
  });

  doc.autoTable({
    startY: 28,
    margin: { left: 10, right: 10 },
    head: [['Cliente','Contacto','Email','Estado','Equipos','Operativos','Vencidos','Total mant.','Completados']],
    body: rows,
    headStyles: { fillColor: PRIMARY, textColor:[255,255,255], fontStyle:'bold', fontSize:7 },
    bodyStyles: { fontSize: 7, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    tableLineColor: [226,232,240], tableLineWidth: 0.2,
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 6 && d.cell.raw > 0) {
        d.cell.styles.textColor = RED; d.cell.styles.fontStyle = 'bold';
      }
    },
  });

  pdfFooter(doc);
  doc.save(`Clientes-${today().replace(/\//g,'-')}.pdf`);
}

// ─── EXCEL: ALL IN ONE WORKBOOK ───────────────────────────────────────────────
function exportExcel(data, sheetType = 'all') {
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();

  const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563EB' } }, alignment: { horizontal: 'center' } };

  // ── Sheet 1: Mantenimientos
  if (sheetType === 'all' || sheetType === 'maintenance') {
    const maintRows = data.maintenances.map(m => {
      const eq = data.equipment.find(e=>e.id===m.equipmentId);
      const cl = data.clients.find(c=>c.id===m.clientId);
      const tech = data.users.find(u=>u.id===m.technicianId);
      return {
        'Fecha': m.date,
        'Número de serie': eq?.serial || '',
        'Modelo': eq?.model || '',
        'Marca': eq?.brand || '',
        'Cliente': cl?.name || '',
        'Tipo': TYPE_LABELS[m.type] || m.type,
        'Estado': STATUS_LABELS[m.status] || m.status,
        'Técnico': tech?.name || 'Sin asignar',
        'Duración (min)': m.duration || '',
        'Observaciones': m.notes || '',
      };
    });
    const ws1 = XLSX.utils.json_to_sheet(maintRows);
    ws1['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Mantenimientos');
  }

  // ── Sheet 2: Equipos
  if (sheetType === 'all' || sheetType === 'equipment') {
    const eqRows = data.equipment.map(eq => {
      const cl = data.clients.find(c=>c.id===eq.clientId);
      const ms = data.maintenances.filter(m=>m.equipmentId===eq.id);
      return {
        'Número de serie': eq.serial,
        'Modelo': eq.model,
        'Marca': eq.brand,
        'Tipo': eq.type,
        'Categoría': eq.category,
        'Cliente': cl?.name || '',
        'Ubicación': eq.location,
        'Estado': STATUS_LABELS[eq.status] || eq.status,
        'Fecha instalación': eq.installDate,
        'Últ. mantenimiento': eq.lastMaintenance,
        'Próx. mantenimiento': eq.nextMaintenance,
        'Intervalo': eq.maintenanceInterval,
        'Total mantenimientos': ms.length,
        'Correctivos': ms.filter(m=>m.type==='corrective').length,
        'Notas': eq.notes || '',
      };
    });
    const ws2 = XLSX.utils.json_to_sheet(eqRows);
    ws2['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Equipos');
  }

  // ── Sheet 3: Inventario
  if (sheetType === 'all' || sheetType === 'inventory') {
    const invRows = data.parts.map(p => {
      const s = p.stock === 0 ? 'Sin stock' : p.stock <= p.criticalStock ? 'Crítico' : p.stock <= p.minStock ? 'Bajo' : 'Normal';
      return {
        'Código': p.code,
        'Nombre': p.name,
        'Descripción': p.description,
        'Depósito': p.depot,
        'Stock actual': p.stock,
        'Stock mínimo': p.minStock,
        'Stock crítico': p.criticalStock,
        'Estado stock': s,
        'Unidad': p.unit,
        'Precio unitario': p.price,
        'Modelos compatibles': p.compatibleModels.join(', '),
      };
    });
    const ws3 = XLSX.utils.json_to_sheet(invRows);
    ws3['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Inventario');
  }

  // ── Sheet 4: Clientes
  if (sheetType === 'all' || sheetType === 'clients') {
    const clRows = data.clients.map(cl => {
      const eqs = data.equipment.filter(e=>e.clientId===cl.id);
      const ms = data.maintenances.filter(m=>m.clientId===cl.id);
      return {
        'Empresa': cl.name,
        'Contacto': cl.contact,
        'Email': cl.email,
        'Teléfono': cl.phone,
        'Estado': STATUS_LABELS[cl.status] || cl.status,
        'Cliente desde': cl.since,
        'Equipos totales': eqs.length,
        'Equipos operativos': eqs.filter(e=>e.status==='operational').length,
        'Equipos vencidos': eqs.filter(e=>e.status==='overdue').length,
        'Total mantenimientos': ms.length,
        'Mantenimientos completados': ms.filter(m=>m.status==='completed').length,
        'Mantenimientos vencidos': ms.filter(m=>m.status==='overdue').length,
      };
    });
    const ws4 = XLSX.utils.json_to_sheet(clRows);
    ws4['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Clientes');
  }

  // ── Sheet 5: Alertas
  if (sheetType === 'all') {
    const alertRows = data.alerts.map(a => {
      const eq = a.entityType === 'equipment' ? data.equipment.find(e=>e.id===a.entityId) : null;
      const cl = a.clientId ? data.clients.find(c=>c.id===a.clientId) : null;
      return {
        'Tipo': a.type === 'overdue' ? 'Vencido' : a.type === 'upcoming' ? 'Próximo' : 'Stock bajo',
        'Severidad': a.severity === 'critical' ? 'Crítico' : a.severity === 'warning' ? 'Advertencia' : 'Info',
        'Mensaje': a.message,
        'Equipo': eq?.model || '—',
        'Serie': eq?.serial || '—',
        'Cliente': cl?.name || '—',
        'Fecha': a.date,
        'Días vencido': a.daysOverdue || '',
        'Días restantes': a.daysAhead || '',
        'Stock actual': a.currentStock ?? '',
        'Stock mínimo': a.minStock ?? '',
      };
    });
    const ws5 = XLSX.utils.json_to_sheet(alertRows);
    ws5['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 50 }, { wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Alertas');
  }

  const filename = sheetType === 'all'
    ? `CMMS-Completo-${today().replace(/\//g,'-')}.xlsx`
    : `CMMS-${sheetType}-${today().replace(/\//g,'-')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ─── EXPORT BUTTON COMPONENT ──────────────────────────────────────────────────
function ExportButton({ type, format, label, icon, getData, variant = 'secondary' }) {
  const [loading, setLoading] = useStateExp(false);

  const handleExport = useCallbackExp(() => {
    setLoading(true);
    const run = () => {
      const data = getData();
      try {
        if (format === 'pdf') {
          if (type === 'summary') exportSummaryPDF(data);
          else if (type === 'maintenance') exportMaintenancesPDF(data);
          else if (type === 'inventory') exportInventoryPDF(data);
          else if (type === 'clients') exportClientsPDF(data);
          else exportSummaryPDF(data);
        } else if (format === 'excel') {
          exportExcel(data, type);
        }
      } catch(e) {
        console.error('Export error:', e);
        alert('Error al exportar. Intentá de nuevo.');
      }
      setLoading(false);
    };

    if (format === 'pdf') {
      waitForLib(() => window.jspdf?.jsPDF, run);
    } else {
      waitForLib(() => window.XLSX, run);
    }
  }, [type, format, getData]);

  const isPrimary = variant === 'primary';
  return (
    <button onClick={handleExport} disabled={loading} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
      background: isPrimary ? (format === 'pdf' ? '#dc2626' : '#059669') : 'var(--bg-card)',
      color: isPrimary ? '#fff' : 'var(--text-secondary)',
      border: isPrimary ? 'none' : '1px solid var(--border)',
      borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
      opacity: loading ? 0.7 : 1, transition: 'all 0.12s', whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (!loading && !isPrimary) { e.currentTarget.style.borderColor = format === 'pdf' ? '#dc2626' : '#059669'; e.currentTarget.style.color = format === 'pdf' ? '#dc2626' : '#059669'; }}}
    onMouseLeave={e => { if (!isPrimary) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
    >
      {loading
        ? <Icon name="loader" size={14} color="currentColor" />
        : <Icon name={icon || 'download'} size={14} color="currentColor" />
      }
      {loading ? 'Exportando...' : label}
    </button>
  );
}

// ─── EXPORT TOOLBAR ───────────────────────────────────────────────────────────
function ExportToolbar({ reportType }) {
  const appData = useApp();
  const getData = useCallbackExp(() => ({
    clients: appData.clients,
    equipment: appData.equipment,
    maintenances: appData.maintenances,
    parts: appData.parts,
    alerts: appData.alerts,
    users: appData.users,
  }), [appData]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <ExportButton type={reportType} format="pdf" label="PDF" icon="download" getData={getData} />
      <ExportButton type={reportType} format="excel" label="Excel" icon="download" getData={getData} />
      {reportType === 'summary' && (
        <ExportButton type="all" format="excel" label="Excel completo" icon="archive" getData={getData} variant="primary" />
      )}
    </div>
  );
}

Object.assign(window, {
  ExportToolbar, ExportButton,
  exportSummaryPDF, exportMaintenancesPDF, exportInventoryPDF, exportClientsPDF, exportExcel,
});
