import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, X, Shield, Check, AlertCircle } from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { getRoleBadgeLabel } from '../utils/auth-permissions';

interface UserManagementModalProps {
  currentUser: User;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ currentUser, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('pramuniaga');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengambil data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.createUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        name: newName.trim(),
        role: newRole,
      });
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('pramuniaga');
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif login.');
      return;
    }

    if (confirm(`Hapus pengguna "${name}"?`)) {
      try {
        await api.deleteUser(id);
        fetchUsers();
      } catch (err: any) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-2xl rounded-none shadow-2xl p-6 my-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="font-mono font-bold text-sm uppercase tracking-wider text-white">
              Manajemen Pengguna & Karyawan (Khusus Manager / Owner)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="border border-zinc-800 p-1 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CREATE USER FORM */}
        <form onSubmit={handleCreateUser} className="bg-zinc-900 border border-zinc-800 p-4 mb-5 font-mono text-xs space-y-3">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />
            <span>Tambah Karyawan / Pengguna Baru</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Username Login:</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="misal: kasir3"
                className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Password:</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password rahasia"
                className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Nama Lengkap Karyawan:</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="misal: Budi Santoso"
                className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Peran / Hak Akses:</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none"
              >
                <option value="pramuniaga">Pramuniaga (Hanya Kasir & Cek Stok)</option>
                <option value="admin">Admin Toko (Kelola Stok, Kategori, Void)</option>
                <option value="manager">Manager / Owner (Akses Penuh)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-500 text-black font-bold px-4 py-2 rounded-none flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Menambahkan...' : 'Simpan Karyawan'}</span>
            </button>
          </div>
        </form>

        {/* USERS LIST TABLE */}
        <div className="border border-zinc-800">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-black text-zinc-400 border-b border-zinc-800">
                <th className="p-3">Username</th>
                <th className="p-3">Nama Karyawan</th>
                <th className="p-3">Peran (Role)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-zinc-500">
                    Memuat daftar karyawan...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/50">
                    <td className="p-3 font-bold text-white">{u.username}</td>
                    <td className="p-3 text-zinc-300 font-sans">{u.name}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 border font-bold ${
                          u.role === 'manager'
                            ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                            : u.role === 'admin'
                            ? 'bg-sky-950/80 border-sky-600 text-sky-300'
                            : 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                        }`}
                      >
                        {getRoleBadgeLabel(u.role)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 border border-emerald-800">
                        AKTIF
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
