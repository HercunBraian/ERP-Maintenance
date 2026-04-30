import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, FileSpreadsheet, Loader2, ChartBar, Wrench, Package, Building2,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  pdfResumen, pdfMantenimientos, pdfInventario, pdfPorCliente,
  excelMantenimientos, excelInventario, excelCompleto,
} from '../lib/reports';

export function Reportes() {
  // Pull everything in parallel — TanStack caches each independently
  const equipos        = useQuery({ queryKey: ['equipos','all-rep'],         queryFn: () => api.equipos.list({ limit: 200 }) });
  const mantenimientos = useQuery({ queryKey: ['mantenimientos','all-rep'],  queryFn: () => api.mantenimientos.list({ limit: 200 }) });
  const stock          = useQuery({ queryKey: ['stock','all-rep'],           queryFn: () => api.stock.list({ limit: 200 }) });
  const clientes       = useQuery({ queryKey: ['clientes','all-rep'],        queryFn: () => api.clientes.list({ limit: 200 }) });
  const alertas        = useQuery({ queryKey: ['alertas','all-rep'],         queryFn: () => api.alertas.list({ resolved: 'all', limit: 500 }) });

  const allLoading = equipos.isLoading || mantenimientos.isLoading || stock.isLoading || clientes.isLoading || alertas.isLoading;

  if (allLoading) {
    return (
      <div className="px-7 pt-7 pb-10">
        <div className="bg-card border border-border rounded-xl p-12 flex justify-center">
          <Loader2 className="animate-spin text-fg-subtle" />
        </div>
      </div>
    );
  }

  const eqs   = equipos.data?.rows ?? [];
  const mts   = mantenimientos.data?.rows ?? [];
  const stk   = stock.data?.rows ?? [];
  const cls   = clientes.data?.rows ?? [];
  const alts  = alertas.data?.rows ?? [];

  return (
    <div className="px-7 pt-7 pb-10">
      <div className="flex items-center gap-2 mb-6">
        <ChartBar className="text-primary" />
        <h1 className="text-lg font-extrabold text-fg">Reportes</h1>
        <span className="text-sm text-fg-subtle ml-2">
          Datos al {new Date().toLocaleDateString('es-AR')} · {mts.length} OTs · {stk.length} stock · {cls.length} clientes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <ReportCard
          icon={ChartBar}
          color="#2563eb"
          title="Resumen general"
          desc="KPIs del sistema, distribución de equipos, totales de OTs y alertas."
          actions={
            <Btn label="PDF" type="pdf" onClick={() =>
              pdfResumen({ equipos: eqs, mantenimientos: mts, alertas: alts, stock: stk })
            } />
          }
        />

        <ReportCard
          icon={Wrench}
          color="#059669"
          title="Mantenimientos"
          desc="Listado completo de OTs con tipo, estado, equipo, cliente, duración."
          actions={
            <>
              <Btn label="PDF" type="pdf" onClick={() => pdfMantenimientos(mts)} />
              <Btn label="Excel" type="xls" onClick={() => excelMantenimientos(mts)} />
            </>
          }
        />

        <ReportCard
          icon={Package}
          color="#8b5cf6"
          title="Inventario"
          desc="Stock por depósito con indicadores crítico/bajo/normal."
          actions={
            <>
              <Btn label="PDF" type="pdf" onClick={() => pdfInventario(stk)} />
              <Btn label="Excel" type="xls" onClick={() => excelInventario(stk)} />
            </>
          }
        />

        <ReportCard
          icon={Building2}
          color="#f59e0b"
          title="Por cliente"
          desc="Métricas agregadas por cliente: equipos, vencidos, OTs completadas y pendientes."
          actions={
            <Btn label="PDF" type="pdf" onClick={() => pdfPorCliente(cls, eqs, mts)} />
          }
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-bold text-fg mb-1">Excel completo</div>
            <div className="text-xs text-fg-subtle">
              Un único archivo .xlsx con 5 sheets: Clientes, Equipos, Mantenimientos, Inventario, Alertas.
            </div>
          </div>
          <Btn
            label="Descargar Excel completo"
            type="xls"
            onClick={() =>
              excelCompleto({
                clientes: cls, equipos: eqs, mantenimientos: mts, alertas: alts, stock: stk,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  icon: Icon, color, title, desc, actions,
}: {
  icon: typeof ChartBar;
  color: string;
  title: string;
  desc: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon size={18} style={{ color }} />
        </div>
        <h3 className="text-sm font-bold text-fg">{title}</h3>
      </div>
      <p className="text-xs text-fg-muted leading-relaxed mb-4 flex-1">{desc}</p>
      <div className="flex gap-2">{actions}</div>
    </div>
  );
}

function Btn({ label, type, onClick }: { label: string; type: 'pdf' | 'xls'; onClick: () => void }) {
  const [busy, setBusy] = useState(false);
  const Icon = type === 'pdf' ? FileText : FileSpreadsheet;
  const color = type === 'pdf' ? '#dc2626' : '#059669';

  const handle = async () => {
    setBusy(true);
    try { await Promise.resolve(onClick()); }
    catch (err) { console.error('[reportes]', err); alert('Error generando el reporte. Mirá la consola.'); }
    finally { setBusy(false); }
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-opacity ${busy ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
      style={{ background: color }}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
      {label}
    </button>
  );
}
