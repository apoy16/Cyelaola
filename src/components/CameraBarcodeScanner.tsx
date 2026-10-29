import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraBarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({ onScan, onClose }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'barcode-scanner-reader';

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        setErrorMsg(null);
        setScanning(true);

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.333,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (mounted) {
              html5QrCode.stop().catch(() => {});
              onScan(decodedText);
            }
          },
          () => {
            // Frame scan failure is normal when no barcode is in view
          }
        );
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err.message || 'Kamera tidak dapat diakses atau izin ditolak');
          setScanning(false);
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, [onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-md rounded-none shadow-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h2 className="font-mono font-bold text-sm uppercase tracking-wider">Scanner Barcode Kamera</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white border border-zinc-800 p-1 cursor-pointer"
            aria-label="Tutup kamera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video feed container */}
        <div className="relative bg-black min-h-[260px] flex items-center justify-center overflow-hidden border border-zinc-800">
          <div id={containerId} className="w-full"></div>

          {errorMsg && (
            <div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs text-zinc-300 mb-3">{errorMsg}</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mb-3">
                Kamera mungkin diblokir di browser atau iframe. Anda dapat mengetikkan/paste barcode di bawah atau gunakan scanner USB barcode hardware.
              </p>
            </div>
          )}
        </div>

        {/* Manual fallback input */}
        <form onSubmit={handleManualSubmit} className="mt-4 pt-3 border-t border-zinc-800">
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
            Input Kode Barcode Manual / Scanner USB:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Contoh: 8998866200224"
              className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 rounded-none"
              autoFocus
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold px-4 py-2 rounded-none cursor-pointer"
            >
              Cari
            </button>
          </div>
        </form>

        <div className="mt-3 text-[11px] text-zinc-500 text-center font-mono">
          Arahkan barcode produk (EAN-13, Code 128, QR) ke tengah kotak bidik
        </div>
      </div>
    </div>
  );
};
