
// Minimal SVG icon system — 24x24 viewBox
function Icon({ name, size = 18, color = 'currentColor', className = '', style = {} }) {
  const paths = {
    dashboard: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7zm2-9v3h3V5H5zm11 0v3h3V5h-3zm0 11v3h3v-3h-3zM5 16v3h3v-3H5z',
    clients: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 4v6m-3-3h6',
    equipment: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
    maintenance: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    inventory: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
    kits: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7h16M4 7l2-4h12l2 4M10 11v4M14 11v4',
    alerts: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
    traceability: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    reports: 'M18 20V10M12 20V4M6 20v-6',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
    search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
    plus: 'M12 5v14M5 12h14',
    chevronRight: 'M9 18l6-6-6-6',
    chevronLeft: 'M15 18l-6-6 6-6',
    chevronDown: 'M6 9l6 6 6-6',
    logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
    clock: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 5v5l4 2',
    calendar: 'M3 9h18M3 5h18M8 3v4M16 3v4M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
    wrench: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
    alertTriangle: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    info: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 6v4m0 4h.01',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
    download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    package: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    chevronUp: 'M18 15l-6-6-6 6',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
    moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
    sun: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z',
    menu: 'M3 12h18M3 6h18M3 18h18',
    arrowRight: 'M5 12h14M12 5l7 7-7 7',
    building: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
    clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 0l8 8 8-8',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    externalLink: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
    grid: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    moreVertical: 'M12 5h.01M12 12h.01M12 19h.01',
    paperclip: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48',
    checkCircle: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
    xCircle: 'M12 2a10 10 0 100 20A10 10 0 0012 2zM15 9l-6 6M9 9l6 6',
    loader: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
    trendingUp: 'M23 6l-9.5 9.5-5-5L1 18',
    archive: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
    cpu: 'M9 3H5a2 2 0 00-2 2v4m6-6h6m-6 0v18m6-18H5m14 0h-4m4 0a2 2 0 012 2v4m-6-6v18m6-12H3m18 0v4a2 2 0 01-2 2h-4m6-6H3m0 0v4a2 2 0 002 2h4',
  };

  const d = paths[name] || paths.info;
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 1.8,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    className, style, 'aria-hidden': 'true',
  },
    React.createElement('path', { d })
  );
}

// Status badge component
function StatusBadge({ status, small = false }) {
  const map = {
    operational: { label: 'Operativo', bg: 'var(--badge-green-bg)', color: 'var(--badge-green-fg)' },
    alert: { label: 'Alerta', bg: 'var(--badge-yellow-bg)', color: 'var(--badge-yellow-fg)' },
    overdue: { label: 'Vencido', bg: 'var(--badge-red-bg)', color: 'var(--badge-red-fg)' },
    maintenance: { label: 'En mantenimiento', bg: 'var(--badge-blue-bg)', color: 'var(--badge-blue-fg)' },
    inactive: { label: 'Inactivo', bg: 'var(--badge-gray-bg)', color: 'var(--badge-gray-fg)' },
    scheduled: { label: 'Programado', bg: 'var(--badge-blue-bg)', color: 'var(--badge-blue-fg)' },
    completed: { label: 'Completado', bg: 'var(--badge-green-bg)', color: 'var(--badge-green-fg)' },
    'in-progress': { label: 'En progreso', bg: 'var(--badge-yellow-bg)', color: 'var(--badge-yellow-fg)' },
    active: { label: 'Activo', bg: 'var(--badge-green-bg)', color: 'var(--badge-green-fg)' },
    critical: { label: 'Crítico', bg: 'var(--badge-red-bg)', color: 'var(--badge-red-fg)' },
    normal: { label: 'Normal', bg: 'var(--badge-green-bg)', color: 'var(--badge-green-fg)' },
    low: { label: 'Bajo', bg: 'var(--badge-yellow-bg)', color: 'var(--badge-yellow-fg)' },
  };
  const s = map[status] || map.inactive;
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 7px' : '3px 10px',
      borderRadius: 999, fontSize: small ? 11 : 12,
      fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }
  }, s.label);
}

// Priority/severity badge
function SeverityBadge({ severity }) {
  const map = {
    critical: { label: 'Crítico', bg: 'var(--badge-red-bg)', color: 'var(--badge-red-fg)' },
    warning: { label: 'Advertencia', bg: 'var(--badge-yellow-bg)', color: 'var(--badge-yellow-fg)' },
    info: { label: 'Info', bg: 'var(--badge-blue-bg)', color: 'var(--badge-blue-fg)' },
  };
  const s = map[severity] || map.info;
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999, fontSize: 11,
      fontWeight: 700, background: s.bg, color: s.color, letterSpacing: '0.03em',
      textTransform: 'uppercase',
    }
  }, s.label);
}

// Avatar component
function Avatar({ initials, size = 32 }) {
  return React.createElement('div', {
    style: {
      width: size, height: size, borderRadius: '50%',
      background: 'var(--primary)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }
  }, initials);
}

// Maintenance type label
function MaintenanceTypeLabel({ type }) {
  const map = {
    'preventive-6m': { label: 'Preventivo 6M', color: '#059669' },
    'preventive-12m': { label: 'Preventivo 12M', color: '#0284c7' },
    'corrective': { label: 'Correctivo', color: '#dc2626' },
    'use-based': { label: 'Por uso', color: '#7c3aed' },
  };
  const s = map[type] || { label: type, color: '#64748b' };
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4, fontSize: 11,
      fontWeight: 600, background: s.color + '18', color: s.color, whiteSpace: 'nowrap',
    }
  }, s.label);
}

Object.assign(window, { Icon, StatusBadge, SeverityBadge, Avatar, MaintenanceTypeLabel });
