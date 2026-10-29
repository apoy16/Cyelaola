import React, { useState } from 'react';
import { Bluetooth, Printer, CheckCircle2, AlertTriangle, X, HelpCircle } from 'lucide-react';
import { StoreSettings } from '../types';

interface BluetoothPrinterModalProps {
  settings: StoreSettings;
  onClose: () => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({ settings, onClose }) => {
  const [device, setDevice] = useState<any>(null);
  const [status, setStatus] = useState<string>('Printer belum terhubung via Web Bluetooth');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const handleConnectBluetooth = async () => {
    if (!isBluetoothSupported) {
      setError('Web Bluetooth API tidak didukung di browser ini. Gunakan Google Chrome desktop atau HP Android.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setStatus('Mencari printer thermal Bluetooth terdekat...');

      // Request bluetooth thermal printer device
      // @ts-ignore
      const bluetoothDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        ],
      });

      setDevice(bluetoothDevice);
      setStatus(`Terhubung ke: ${bluetoothDevice.name || 'Printer Thermal BT'}`);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setError(err.message || 'Gagal menyambungkan printer Bluetooth');
      }
      setStatus('Koneksi dibatalkan');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-lg rounded-none shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-sky-400" />
            <h2 className="font-mono font-bold text-base uppercase tracking-wider">Koneksi Thermal Printer</h2>
          </div>
          <button onClick={onClose} className="border border-zinc-800 p-1 text-zinc-400 hover:text-white cursor-pointer" aria-label="Tutup modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status */}
        <div className="p-3 bg-zinc-900 border border-zinc-800 mb-4 font-mono text-xs">
          <div className="flex items-center gap-2 mb-1">
            {device ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span className="font-semibold">{status}</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Mode Kertas Aktif: <strong className="text-white">{settings.paper_size}</strong> | Auto-Print: <strong className="text-white">{settings.auto_print ? 'Aktif' : 'Non-aktif'}</strong>
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={handleConnectBluetooth}
            disabled={isConnecting}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Bluetooth className="w-4 h-4" />
            {isConnecting ? 'Mencari Perangkat...' : 'Hubungkan Printer Bluetooth (Web Bluetooth API)'}
          </button>

          <button
            onClick={handleTestBrowserPrint}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            Uji Cetak Thermal Langsung (Driver USB / Sistem Browser)
          </button>
        </div>

        {/* Guide */}
        <div className="bg-zinc-900/50 p-4 border border-zinc-800 text-[11px] text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-200 font-bold uppercase font-mono">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            Panduan Setting Thermal Printer Grosir:
          </div>
          <ol className="list-decimal pl-4 space-y-1 font-sans">
            <li>
              <strong>Printer USB / Kabel:</strong> Pasang kabel USB ke komputer kasir. Buka print dialog, pilih printer thermal (misal Epson TM-T82, Iware, Panda, Xprinter). Atur paper size ke 58mm atau 80mm dan aktifkan "Auto-Print".
            </li>
            <li>
              <strong>Printer Bluetooth (HP / Laptop):</strong> Nyalakan printer thermal. Klik tombol biru di atas, izinkan browser memindai perangkat, lalu pilih printer BT Anda.
            </li>
            <li>
              <strong>Cetak Tanpa Dialog (Kiosk Mode):</strong> Di Google Chrome, jalankan dengan argumen <code>--kiosk-printing</code> agar setiap klik bayar langsung mencetak kertas tanpa popup dialog.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
