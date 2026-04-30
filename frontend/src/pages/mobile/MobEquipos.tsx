import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ScanLine, Cpu, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/badges';
import { QRScanner } from '../../components/mobile/QRScanner';

export function MobEquipos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);

  const list = useQuery({
    queryKey: ['equipos', 'mob-list'],
    queryFn: () => api.equipos.list({ limit: 200 }),
  });

  const filtered = useMemo(() => {
    const all = list.data?.rows ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((e) =>
      e.serial.toLowerCase().includes(q) ||
      e.model.toLowerCase().includes(q) ||
      e.brand.toLowerCase().includes(q) ||
      String(e.code).includes(q),
    );
  }, [list.data, search]);

  /** When a QR is scanned, parse out the token and look up the equipo. */
  const handleScan = async (text: string) => {
    setScanning(false);
    // QR contents are URLs like `<PUBLIC_APP_URL>/scan/<token>`.
    // Extract the last path segment as the token.
    let token = text.trim();
    try {
      const u = new URL(text);
      const last = u.pathname.split('/').filter(Boolean).pop();
      if (last) token = last;
    } catch { /* not a URL — assume raw token */ }

    try {
      const r = await api.scan.public(token);
      navigate(`/equipos/${r.equipo_id}`);
    } catch {
      alert('No se encontró un equipo para este QR.');
    }
  };

  return (
    <div className="font-sans pt-5">
      <div className="px-5 mb-4">
        <h1 className="text-xl font-extrabold text-fg mb-3">Equipos</h1>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3.5 py-2.5">
            <Search size={16} className="text-fg-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Serie, modelo, marca…"
              className="bg-transparent text-fg text-sm outline-none w-full placeholder:text-fg-subtle"
            />
          </div>
          <button
            onClick={() => setScanning(true)}
            className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-card active:scale-95 transition-transform"
            aria-label="Escanear QR"
          >
            <ScanLine size={20} />
          </button>
        </div>
      </div>

      <div className="px-5 space-y-2">
        {filtered.map((e) => (
          <button
            key={e.id}
            onClick={() => navigate(`/equipos/${e.id}`)}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card text-left active:scale-[0.99] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Cpu size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-fg truncate">{e.model}</div>
              <div className="text-[11px] text-fg-subtle truncate">
                {e.serial} · {e.cliente?.name ?? '—'}
              </div>
              <div className="mt-1.5">
                <StatusBadge status={e.status} small />
              </div>
            </div>
            <ChevronRight size={18} className="text-fg-subtle flex-shrink-0" />
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-fg-subtle text-sm">
            Sin equipos que coincidan.
          </div>
        )}
      </div>

      <QRScanner open={scanning} onClose={() => setScanning(false)} onResult={handleScan} />
    </div>
  );
}
