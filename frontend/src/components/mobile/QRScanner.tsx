import { useEffect, useRef, useState } from 'react';
import { X, ScanLine, AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the decoded text when a code is scanned. */
  onResult: (text: string) => void;
}

/**
 * Camera-based QR scanner. Uses html5-qrcode (lazy-loaded so the bundle stays
 * small until a tech actually opens the scanner). The library inserts a
 * <video> into the target div and streams from the rear camera.
 */
export function QRScanner({ open, onClose, onResult }: Props) {
  const containerId = 'qr-scanner-container';
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError(null);
    setStarting(true);

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const html5Qr = new Html5Qrcode(containerId);
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
          (decodedText) => {
            // Stop on first successful read; the modal closes via onResult.
            if (!cancelled) {
              void html5Qr.stop().catch(() => {});
              onResult(decodedText);
            }
          },
          () => {
            // Per-frame decode failures are normal — ignored.
          },
        );

        stopRef.current = async () => {
          try {
            await html5Qr.stop();
            await html5Qr.clear();
          } catch {
            /* swallow — stop while not running throws */
          }
        };
      } catch (err) {
        if (!cancelled) {
          console.error('[qr-scanner]', err);
          setError(
            err instanceof Error && err.message.includes('Permission')
              ? 'Permiso de cámara denegado.'
              : 'No se pudo iniciar la cámara.',
          );
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      if (stopRef.current) {
        void stopRef.current().catch(() => {});
        stopRef.current = null;
      }
    };
  }, [open, onResult]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 bg-black/70 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <ScanLine size={18} />
          <span className="text-sm font-bold">Escanear código QR</span>
        </div>
        <button onClick={onClose} className="p-1.5" aria-label="Cerrar scanner">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* html5-qrcode renders the video here */}
        <div id={containerId} className="w-full h-full" />

        {/* Overlay guides */}
        {!error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-[240px] h-[240px]">
              {/* Corner brackets */}
              <Corner pos="tl" />
              <Corner pos="tr" />
              <Corner pos="bl" />
              <Corner pos="br" />
              {/* Animated scanning line */}
              <div className="absolute left-0 right-0 h-0.5 bg-primary animate-[scan-line_2s_ease-in-out_infinite]" />
              <style>{`@keyframes scan-line {
                0%   { top: 0;    opacity: 1; }
                50%  { top: 100%; opacity: 1; }
                100% { top: 0;    opacity: 0; }
              }`}</style>
            </div>
          </div>
        )}

        {starting && !error && (
          <div className="absolute bottom-12 text-white text-sm bg-black/60 px-3 py-1.5 rounded-full">
            Iniciando cámara…
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
            <div className="bg-card rounded-2xl p-6 max-w-sm text-center shadow-card-lg">
              <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
              <div className="text-base font-bold text-fg mb-2">{error}</div>
              <p className="text-xs text-fg-muted mb-4">
                Habilitá la cámara desde la configuración del navegador y volvé a intentar.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="px-5 py-3 text-center text-white/70 text-xs bg-black/70 flex-shrink-0">
        Apuntá la cámara al código QR del equipo
      </footer>
    </div>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base = 'absolute w-6 h-6 border-primary';
  const map = {
    tl: 'top-0 left-0 border-t-4 border-l-4 rounded-tl-lg',
    tr: 'top-0 right-0 border-t-4 border-r-4 rounded-tr-lg',
    bl: 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg',
    br: 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg',
  } as const;
  return <div className={`${base} ${map[pos]}`} />;
}
