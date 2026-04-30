import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Building2, Cpu } from 'lucide-react';
import { api } from '../lib/api';

export function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 250ms debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Click outside closes the dropdown
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const results = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: async () => {
      const [c, e] = await Promise.all([
        api.clientes.list({ search: debounced, limit: 5 }),
        api.equipos.list({ search: debounced, limit: 5 }),
      ]);
      return { clientes: c.rows, equipos: e.rows };
    },
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  const total = (results.data?.clientes.length ?? 0) + (results.data?.equipos.length ?? 0);
  const showDropdown = open && debounced.length >= 2;

  const go = (path: string) => {
    setQ('');
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex items-center gap-2 bg-input-bg border border-border rounded-lg px-3 py-1.5 w-[280px] focus-within:border-primary transition-colors">
        <Search size={15} className="text-fg-subtle" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar clientes, equipos, series..."
          className="bg-transparent text-fg text-sm outline-none w-full placeholder:text-fg-subtle"
        />
        {q && (
          <button onClick={() => { setQ(''); setDebounced(''); }} className="text-fg-subtle hover:text-fg transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-card-lg overflow-hidden z-40">
          {results.isLoading && (
            <div className="p-4 text-center text-fg-subtle text-sm">Buscando…</div>
          )}
          {!results.isLoading && total === 0 && (
            <div className="p-4 text-center text-fg-subtle text-sm">Sin resultados</div>
          )}
          {!results.isLoading && (results.data?.clientes.length ?? 0) > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-bold text-fg-subtle uppercase tracking-wider bg-input-bg border-b border-border">
                Clientes
              </div>
              {results.data!.clientes.map((c) => (
                <button
                  key={c.id}
                  onMouseDown={() => go(`/clientes/${c.id}`)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-hover-bg transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-fg truncate">{c.name}</div>
                    <div className="text-[11px] text-fg-subtle truncate">{c.contact_name ?? c.code}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!results.isLoading && (results.data?.equipos.length ?? 0) > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-bold text-fg-subtle uppercase tracking-wider bg-input-bg border-b border-border">
                Equipos
              </div>
              {results.data!.equipos.map((e) => (
                <button
                  key={e.id}
                  onMouseDown={() => go(`/equipos/${e.id}`)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-hover-bg transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Cpu size={14} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-fg truncate">{e.model}</div>
                    <div className="text-[11px] text-fg-subtle truncate">{e.serial} · {e.brand}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
