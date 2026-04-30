import { useEffect, useState } from 'react';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  equipoId: string;
  equipoCode: number;
  equipoSerial: string;
  qrToken: string;
}

export function QRModal({ open, onClose, equipoId, equipoCode, equipoSerial, qrToken }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setImgSrc(null);
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    setLoading(true);

    api.equipos
      .qrBlob(equipoId, 'png', 480)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImgSrc(url);
      })
      .catch((err) => {
        console.error('[qr] fetch failed', err);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, equipoId]);

  const downloadPng = async () => {
    const blob = await api.equipos.qrBlob(equipoId, 'png', 1024);
    triggerDownload(blob, `qr-${equipoCode}.png`);
  };
  const downloadSvg = async () => {
    const blob = await api.equipos.qrBlob(equipoId, 'svg', 480);
    triggerDownload(blob, `qr-${equipoCode}.svg`);
  };

  const copyToken = async () => {
    await navigator.clipboard.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title={`QR · ${equipoCode}`} maxWidth={420}>
      <div className="flex flex-col items-center">
        <div className="w-[280px] h-[280px] bg-white rounded-xl border border-border flex items-center justify-center overflow-hidden">
          {loading && <Loader2 className="animate-spin text-fg-subtle" />}
          {!loading && imgSrc && (
            <img src={imgSrc} alt={`QR para ${equipoCode}`} className="w-full h-full object-contain" />
          )}
          {!loading && !imgSrc && (
            <span className="text-fg-subtle text-sm">No se pudo cargar el QR</span>
          )}
        </div>

        <div className="text-center mt-4 mb-4">
          <div className="text-xs text-fg-subtle uppercase tracking-wider font-semibold">Serie</div>
          <div className="text-base font-bold text-fg mt-0.5">{equipoSerial}</div>
        </div>

        <div className="w-full bg-input-bg border border-border rounded-lg px-3 py-2 flex items-center gap-2 mb-4">
          <code className="text-xs text-fg-muted flex-1 truncate font-mono">{qrToken}</code>
          <button
            onClick={copyToken}
            className="text-fg-muted hover:text-primary transition-colors p-1"
            title="Copiar token"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            onClick={downloadPng}
            className="flex items-center justify-center gap-2 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Download size={15} /> PNG
          </button>
          <button
            onClick={downloadSvg}
            className="flex items-center justify-center gap-2 py-2 bg-bg border border-border text-fg rounded-lg text-sm font-semibold hover:bg-hover-bg transition-colors"
          >
            <Download size={15} /> SVG
          </button>
        </div>
      </div>
    </Modal>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
