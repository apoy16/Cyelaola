import React, { useState } from 'react';
import { Lock, User as UserIcon, Shield, Check, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { User, UserRole } from '../types';
import { api, setCurrentUserRole } from '../services/api';
import { getRoleBadgeLabel } from '../utils/auth-permissions';

interface LoginModalProps {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ currentUser, onLoginSuccess, onClose }) => {
  const [username, setUsername] = useState('kasir1');
  const [password, setPassword] = useState('kasir123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan password wajib diisi');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const user = await api.login(username.trim(), password);
      setCurrentUserRole(user.role);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = (demoUsername: string, demoPass: string) => {
    setUsername(demoUsername);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-md rounded-none shadow-2xl p-6 my-4">
        {/* Header */}
        <div className="text-center pb-4 mb-4 border-b border-zinc-800">
          <div className="inline-flex p-2.5 bg-zinc-900 border border-zinc-700 mb-2">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="font-mono font-bold text-base uppercase tracking-wider text-white">
            Autentikasi & Hak Akses Kasir
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Masuk dengan peran Pramuniaga, Admin Toko, atau Manager (Owner).
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* QUICK 1-CLICK ROLE SELECTOR FOR TESTING */}
        <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="text-[11px] font-mono text-zinc-400 uppercase font-semibold flex items-center justify-between">
            <span>Pilih Cepat Akun Demo:</span>
            <span className="text-emerald-400 text-[10px]">1-Klik Siap Uji</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemoSelect('kasir1', 'kasir123')}
              className={`p-2 border rounded-none text-left cursor-pointer transition-colors ${
                username === 'kasir1'
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="font-bold">Pramuniaga</div>
              <div className="text-[9px] text-zinc-500">kasir1 / kasir123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoSelect('admin', 'admin123')}
              className={`p-2 border rounded-none text-left cursor-pointer transition-colors ${
                username === 'admin'
                  ? 'bg-sky-950 border-sky-500 text-sky-300'
                  : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="font-bold">Admin Toko</div>
              <div className="text-[9px] text-zinc-500">admin / admin123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoSelect('owner', 'owner123')}
              className={`p-2 border rounded-none text-left cursor-pointer transition-colors ${
                username === 'owner'
                  ? 'bg-amber-950 border-amber-500 text-amber-300'
                  : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="font-bold">Manager</div>
              <div className="text-[9px] text-zinc-500">owner / owner123</div>
            </button>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Username:</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username akun..."
                className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-700 text-white rounded-none focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Password:</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password..."
                className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-700 text-white rounded-none focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk Aplikasi'}</span>
            </button>
          </div>
        </form>

        {/* PERMISSIONS SUMMARY TABLE */}
        <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] text-zinc-400 font-mono space-y-1.5">
          <div className="font-bold text-zinc-200 uppercase">Batasan Hak Akses:</div>
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-black/50 p-1.5 border border-zinc-900">
              <strong className="text-emerald-400 block">Pramuniaga:</strong>
              • Kasir POS & Cetak<br />
              • Cek Sisa Stok & Harga<br />
              ✕ Modal/Profit Tersembunyi<br />
              ✕ Batal/Void Transaksi
            </div>
            <div className="bg-black/50 p-1.5 border border-zinc-900">
              <strong className="text-sky-400 block">Admin Toko:</strong>
              • Kasir POS & Void<br />
              • CRUD Barang & Stok<br />
              • Kategori & Supplier<br />
              ✕ Manajemen User Karyawan
            </div>
            <div className="bg-black/50 p-1.5 border border-zinc-900">
              <strong className="text-amber-400 block">Manager / Owner:</strong>
              • Akses Penuh Sistem<br />
              • CRUD User Karyawan<br />
              • Laporan Omzet Toko<br />
              • Pengaturan Identitas
            </div>
          </div>
        </div>

        {onClose && currentUser && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer"
            >
              Kembali ke Aplikasi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
