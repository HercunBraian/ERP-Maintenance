import QRCode from 'qrcode';

export interface QROptions {
  size?: number;     // pixel width for PNG
  margin?: number;   // quiet-zone modules
}

const DEFAULTS = {
  errorCorrectionLevel: 'H' as const, // ~30% recovery — robust to wear/dirt
  margin: 2,
  width: 400,
  color: { dark: '#000000', light: '#ffffff' },
};

export async function generateQRPng(text: string, opts: QROptions = {}): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    ...DEFAULTS,
    width: opts.size ?? DEFAULTS.width,
    margin: opts.margin ?? DEFAULTS.margin,
    type: 'png',
  });
}

export async function generateQRSvg(text: string, opts: QROptions = {}): Promise<string> {
  return QRCode.toString(text, {
    ...DEFAULTS,
    width: opts.size ?? DEFAULTS.width,
    margin: opts.margin ?? DEFAULTS.margin,
    type: 'svg',
  });
}

/** Build the URL embedded inside the QR for an equipo. */
export function buildScanUrl(publicAppUrl: string, qrToken: string): string {
  return `${publicAppUrl.replace(/\/$/, '')}/scan/${qrToken}`;
}
