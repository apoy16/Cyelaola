import React, { useState } from 'react';
import { Settings as SettingsIcon, Printer, Bluetooth, Save, Store, FileText, CheckCircle2 } from 'lucide-react';
import { StoreSettings } from '../types';
import { api } from '../services/api';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';

interface SettingsTabProps {
  settings: StoreSettings;
  onUpdate: (updated: StoreSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSuccessMsg(null);
      const res = await api.updateSettings(formData);
      onUpdate(res);
      setSuccessMsg('Pengaturan toko dan konfigurasi printer thermal berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="font-mono font-bold text-base uppercase tracking-wider">
                Pengaturan Toko & Konfigurasi Printer Thermal
              </h2>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Konfigurasi identitas toko, ukuran kertas kasir (58mm/80mm), dan trigger auto-print cetak struk langsung.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBluetoothModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold px-3 py-2 rounded-none flex items-center gap-1.5 cursor-pointer"
          >
            <Bluetooth className="w-4 h-4" />
            <span>Koneksi Bluetooth Printer</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 font-mono text-xs">
          {/* TOKO PROFILE */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-wider pb-2 border-b border-zinc-800">
              <Store className="w-4 h-4" />
              <span>Identitas Toko Grosir</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Nama Toko:</label>
                <input
                  type="text"
                  required
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  className="w-full bg-black border border-zinc-700 px-3 py-2 text-white rounded-none focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Nomor Telepon / WhatsApp Kasir:</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-black border border-zinc-700 px-3 py-2 text-white rounded-none focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Alamat Toko / Pasar:</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-black border border-zinc-700 px-3 py-2 text-white rounded-none focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Kota / Wilayah:</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-black border border-zinc-700 px-3 py-2 text-white rounded-none focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* THERMAL PRINTER SETTINGS */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-sky-400 uppercase tracking-wider pb-2 border-b border-zinc-800">
              <Printer className="w-4 h-4" />
              <span>Konfigurasi Thermal Receipt & Cetak Langsung</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Ukuran Lebar Kertas Printer:</label>
                <select
                  value={formData.paper_size}
                  onChange={(e) => setFormData({ ...formData, paper_size: e.target.value as any })}
                  className="w-full bg-black border border-zinc-700 px-3 py-2 text-white rounded-none focus:outline-none"
                >
                  <option value="58mm">Standar 58mm (Printer Thermal Mini / Portabel)</option>
                  <option value="80mm">Standar 80mm (Printer Kasir Toko POS Besar)</option>
                </select>
                <p className="text-[10px] text-zinc-500 mt-1 font-sans">
                  CSS cetak struk otomatis menyesuaikan lebar (54mm untuk roll 58mm, atau 76mm untuk roll 80mm).
                </p>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Auto-Print Trigger Saat Pembayaran:</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="auto_print_toggle"
                    checked={formData.auto_print === 1}
                    onChange={(e) => setFormData({ ...formData, auto_print: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 accent-emerald-500 rounded-none cursor-pointer"
                  />
                  <label htmlFor="auto_print_toggle" className="text-zinc-200 cursor-pointer select-none">
                    Aktifkan Auto-Print (Langsung cetak struk begitu bayar selesai)
                  </label>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 font-sans">
                  Jika aktif, dialog print atau Web Bluetooth langsung dipanggil tanpa perlu klik tombol cetak tambahan.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">
                Catatan Kaki Struk / Footer Nota (Kebijakan Toko & Ucapan):
              </label>
              <textarea
                rows={3}
                value={formData.receipt_footer}
                onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                className="w-full bg-black border border-zinc-700 p-2.5 text-white rounded-none focus:outline-none"
              />
              <p className="text-[10px] text-zinc-500 mt-1 font-sans">
                Teks ini dicetak di bagian paling bawah struk thermal.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTestPrint}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-2 text-xs font-mono font-bold rounded-none flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Cetak Halaman Printer</span>
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs px-6 py-3 rounded-none flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan Perubahan...' : 'Simpan Konfigurasi Toko'}</span>
            </button>
          </div>
        </form>
      </div>

      {isBluetoothModalOpen && (
        <BluetoothPrinterModal
          settings={formData}
          onClose={() => setIsBluetoothModalOpen(false)}
        />
      )}
    </div>
  );
};
