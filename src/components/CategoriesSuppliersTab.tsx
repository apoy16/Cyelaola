import React, { useState } from 'react';
import { Layers, Truck, Plus, Edit, Trash2, X, Phone, MapPin, CreditCard } from 'lucide-react';
import { Category, Supplier } from '../types';
import { api } from '../services/api';

interface CategoriesSuppliersTabProps {
  categories: Category[];
  suppliers: Supplier[];
  onRefresh: () => void;
}

export const CategoriesSuppliersTab: React.FC<CategoriesSuppliersTabProps> = ({
  categories,
  suppliers,
  onRefresh,
}) => {
  // Category state
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Supplier state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [supForm, setSupForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: '',
    payment_terms: 'Tempo 14 Hari',
  });

  // Handle Category Save
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCat) {
        await api.updateCategory(editingCat.id, { name: catName.trim(), description: catDesc.trim() });
      } else {
        await api.createCategory({ name: catName.trim(), description: catDesc.trim() });
      }
      setCatName('');
      setCatDesc('');
      setEditingCat(null);
      onRefresh();
    } catch (err: any) {
      alert('Gagal menyimpan kategori: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (confirm(`Hapus kategori "${name}"?`)) {
      try {
        await api.deleteCategory(id);
        onRefresh();
      } catch (err: any) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  // Handle Supplier Save
  const handleOpenSupplierCreate = () => {
    setEditingSup(null);
    setSupForm({
      name: '',
      contact_person: '',
      phone: '',
      address: '',
      payment_terms: 'Tempo 14 Hari',
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenSupplierEdit = (sup: Supplier) => {
    setEditingSup(sup);
    setSupForm({
      name: sup.name,
      contact_person: sup.contact_person,
      phone: sup.phone,
      address: sup.address,
      payment_terms: sup.payment_terms,
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supForm.name.trim()) return;

    try {
      if (editingSup) {
        await api.updateSupplier(editingSup.id, supForm);
      } else {
        await api.createSupplier(supForm);
      }
      setIsSupplierModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert('Gagal menyimpan supplier: ' + err.message);
    }
  };

  const handleDeleteSupplier = async (id: number, name: string) => {
    if (confirm(`Hapus supplier "${name}"?`)) {
      try {
        await api.deleteSupplier(id);
        onRefresh();
      } catch (err: any) {
        alert('Gagal menghapus supplier: ' + err.message);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* LEFT: CATEGORIES */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-800 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-800">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h2 className="font-mono font-bold text-sm uppercase tracking-wider">
            Kategori Produk Grosir ({categories.length})
          </h2>
        </div>

        {/* Category Form */}
        <form onSubmit={handleSaveCategory} className="bg-zinc-900 border border-zinc-800 p-4 mb-4 font-mono text-xs space-y-3">
          <div className="text-[11px] font-bold text-zinc-300 uppercase">
            {editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Nama Kategori:</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Contoh: Beras & Sembako Pokok"
              className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Keterangan / Catatan:</label>
            <input
              type="text"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Contoh: Beras karung, ketan, gula pasir"
              className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {editingCat && (
              <button
                type="button"
                onClick={() => {
                  setEditingCat(null);
                  setCatName('');
                  setCatDesc('');
                }}
                className="border border-zinc-700 px-3 py-1 text-zinc-400 hover:text-white rounded-none cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-none cursor-pointer"
            >
              {editingCat ? 'Update Kategori' : '+ Tambah Kategori'}
            </button>
          </div>
        </form>

        {/* Category List */}
        <div className="space-y-2 flex-1">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-3 bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="font-semibold text-sm text-zinc-200">{c.name}</div>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                  {c.description || 'Tidak ada deskripsi'} • {c.items_count || 0} Barang Terdaftar
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCat(c);
                    setCatName(c.name);
                    setCatDesc(c.description || '');
                  }}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                  title="Edit Kategori"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 cursor-pointer"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: SUPPLIERS */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-400" />
            <h2 className="font-mono font-bold text-sm uppercase tracking-wider">
              Daftar Supplier / Pemasok ({suppliers.length})
            </h2>
          </div>
          <button
            onClick={handleOpenSupplierCreate}
            className="bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold px-3 py-1.5 rounded-none flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Supplier</span>
          </button>
        </div>

        {/* Suppliers Cards */}
        <div className="space-y-3">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-none hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">{s.name}</h3>
                  <div className="text-xs text-sky-400 font-mono mt-0.5">
                    PIC: {s.contact_person || '-'}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenSupplierEdit(s)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                    title="Edit Supplier"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(s.id, s.name)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 cursor-pointer"
                    title="Hapus Supplier"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-zinc-400 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{s.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Termin: <strong className="text-white">{s.payment_terms}</strong></span>
                </div>
                <div className="col-span-1 sm:col-span-2 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  <span className="truncate">{s.address || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-md rounded-none shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h2 className="font-mono font-bold text-sm uppercase text-sky-400">
                {editingSup ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
              </h2>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="border border-zinc-800 p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nama Perusahaan / Distributor:</label>
                <input
                  type="text"
                  required
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  placeholder="Contoh: PT Indofood CBP Sukses Makmur"
                  className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Nama Sales / PIC Kontak:</label>
                <input
                  type="text"
                  value={supForm.contact_person}
                  onChange={(e) => setSupForm({ ...supForm, contact_person: e.target.value })}
                  placeholder="Contoh: Bpk. Hendra Saputra"
                  className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Nomor Telepon / WhatsApp:</label>
                <input
                  type="text"
                  value={supForm.phone}
                  onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                  placeholder="0812-..."
                  className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Termin Pembayaran:</label>
                <select
                  value={supForm.payment_terms}
                  onChange={(e) => setSupForm({ ...supForm, payment_terms: e.target.value })}
                  className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none"
                >
                  <option value="COD (Tunai)">COD (Tunai Saat Barang Datang)</option>
                  <option value="Tempo 7 Hari">Tempo 7 Hari</option>
                  <option value="Tempo 14 Hari">Tempo 14 Hari</option>
                  <option value="Tempo 30 Hari">Tempo 30 Hari</option>
                  <option value="Transfer Bank">Transfer Bank di Awal</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Alamat Gudang / Kantor:</label>
                <textarea
                  rows={2}
                  value={supForm.address}
                  onChange={(e) => setSupForm({ ...supForm, address: e.target.value })}
                  placeholder="Kawasan Industri Pulogadung..."
                  className="w-full bg-black border border-zinc-700 p-2 text-white rounded-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="border border-zinc-700 px-3 py-1.5 text-zinc-400 hover:text-white rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-1.5 rounded-none cursor-pointer"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
