import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Check,
  X,
  Boxes,
  Barcode,
} from 'lucide-react';
import { Item, Category, Supplier, UserRole } from '../types';
import { api } from '../services/api';
import { formatRupiah } from '../utils/pos-calculations';
import { getRolePermissions } from '../utils/auth-permissions';

interface InventoryTabProps {
  items: Item[];
  categories: Category[];
  suppliers: Supplier[];
  userRole: UserRole;
  onRefresh: () => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  categories,
  suppliers,
  userRole,
  onRefresh,
}) => {
  const permissions = getRolePermissions(userRole);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Restock modal state
  const [restockItem, setRestockItem] = useState<Item | null>(null);
  const [restockQty, setRestockQty] = useState<number>(1);
  const [restockUnit, setRestockUnit] = useState<'retail' | 'wholesale'>('wholesale');

  // Form fields
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category_id: '',
    supplier_id: '',
    cost_price: 0,
    retail_price: 0,
    wholesale_price: 0,
    wholesale_min_qty: 1,
    unit_retail: 'Pcs',
    unit_wholesale: 'Dus',
    pieces_per_wholesale: 24,
    stock_pcs: 0,
    min_stock_alert: 24,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCat === 'all' || String(item.category_id) === selectedCat;
    const matchStock = !onlyLowStock || item.stock_pcs <= item.min_stock_alert;
    return matchSearch && matchCat && matchStock;
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      barcode: '899' + Math.floor(1000000000 + Math.random() * 9000000000),
      name: '',
      category_id: categories[0]?.id ? String(categories[0].id) : '',
      supplier_id: suppliers[0]?.id ? String(suppliers[0].id) : '',
      cost_price: 0,
      retail_price: 0,
      wholesale_price: 0,
      wholesale_min_qty: 1,
      unit_retail: 'Pcs',
      unit_wholesale: 'Dus',
      pieces_per_wholesale: 24,
      stock_pcs: 0,
      min_stock_alert: 24,
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      barcode: item.barcode,
      name: item.name,
      category_id: item.category_id ? String(item.category_id) : '',
      supplier_id: item.supplier_id ? String(item.supplier_id) : '',
      cost_price: item.cost_price,
      retail_price: item.retail_price,
      wholesale_price: item.wholesale_price,
      wholesale_min_qty: item.wholesale_min_qty,
      unit_retail: item.unit_retail,
      unit_wholesale: item.unit_wholesale,
      pieces_per_wholesale: item.pieces_per_wholesale,
      stock_pcs: item.stock_pcs,
      min_stock_alert: item.min_stock_alert,
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barcode.trim() || !formData.name.trim()) {
      setErrorMsg('Barcode dan Nama Barang wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        barcode: formData.barcode.trim(),
        name: formData.name.trim(),
        category_id: formData.category_id ? Number(formData.category_id) : null,
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        cost_price: Number(formData.cost_price),
        retail_price: Number(formData.retail_price),
        wholesale_price: Number(formData.wholesale_price),
        wholesale_min_qty: Number(formData.wholesale_min_qty),
        unit_retail: formData.unit_retail,
        unit_wholesale: formData.unit_wholesale,
        pieces_per_wholesale: Number(formData.pieces_per_wholesale),
        stock_pcs: Number(formData.stock_pcs),
        min_stock_alert: Number(formData.min_stock_alert),
      };

      if (editingItem) {
        await api.updateItem(editingItem.id, payload);
      } else {
        await api.createItem(payload);
      }

      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan barang');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus barang "${name}"?`)) {
      try {
        await api.deleteItem(id);
        onRefresh();
      } catch (err: any) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;

    try {
      await api.adjustStock(restockItem.id, 'add', restockQty, restockUnit);
      setRestockItem(null);
      onRefresh();
    } catch (err: any) {
      alert('Gagal menambah stok: ' + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* TOOLBAR */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-2">
          <Boxes className="w-5 h-5 text-emerald-400" />
          <h2 className="font-mono font-bold text-sm uppercase tracking-wider">
            Manajemen Barang & Stok Grosir ({items.length} Item)
          </h2>
          {!permissions.canEditInventory && (
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 border border-zinc-700">
              Mode Akses: Pramuniaga (Hanya Cek Stok & Harga)
            </span>
          )}
        </div>

        {permissions.canEditInventory && (
          <button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold px-3 py-2 rounded-none flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang Baru</span>
          </button>
        )}
      </div>

      {/* FILTER & SEARCH */}
      <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama barang atau scan barcode..."
            className="w-full pl-9 pr-3 py-1.5 bg-black border border-zinc-700 text-xs font-mono text-white rounded-none focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="bg-black border border-zinc-700 text-xs font-mono text-zinc-200 px-3 py-1.5 rounded-none focus:outline-none"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`px-3 py-1.5 font-mono text-xs border rounded-none flex items-center gap-1.5 cursor-pointer ${
            onlyLowStock
              ? 'bg-amber-950 border-amber-600 text-amber-300'
              : 'bg-black border-zinc-700 text-zinc-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Hanya Stok Menipis</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-black text-zinc-400 border-b border-zinc-800">
              <th className="p-3 font-semibold">Barcode</th>
              <th className="p-3 font-semibold">Nama Barang</th>
              <th className="p-3 font-semibold">Kategori</th>
              <th className="p-3 font-semibold text-right">Modal</th>
              <th className="p-3 font-semibold text-right">Eceran</th>
              <th className="p-3 font-semibold text-right">Grosir / Dus</th>
              <th className="p-3 font-semibold text-center">Isi Dus</th>
              <th className="p-3 font-semibold text-right">Sisa Stok</th>
              <th className="p-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-zinc-500">
                  Tidak ada barang yang sesuai dengan pencarian atau filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isLow = item.stock_pcs <= item.min_stock_alert;
                const dusCount = Math.floor(item.stock_pcs / item.pieces_per_wholesale);
                const sisaPcs = item.stock_pcs % item.pieces_per_wholesale;

                return (
                  <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3 text-zinc-400">
                      <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[11px]">
                        {item.barcode}
                      </span>
                    </td>
                    <td className="p-3 font-sans font-semibold text-zinc-200">
                      {item.name}
                      {item.supplier_name && (
                        <span className="block font-mono font-normal text-[10px] text-zinc-500">
                          Dist: {item.supplier_name}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-400">{item.category_name || '-'}</td>
                    <td className="p-3 text-right text-zinc-400">
                      {permissions.canViewCostPrice ? (
                        formatRupiah(item.cost_price)
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-mono">Privasi</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-emerald-400 font-semibold">
                      {formatRupiah(item.retail_price)}/{item.unit_retail}
                    </td>
                    <td className="p-3 text-right text-amber-400 font-semibold">
                      {formatRupiah(item.wholesale_price)}/{item.unit_wholesale}
                    </td>
                    <td className="p-3 text-center text-zinc-400">
                      {item.pieces_per_wholesale} {item.unit_retail}
                    </td>
                    <td className="p-3 text-right">
                      <div className={isLow ? 'text-amber-400 font-bold' : 'text-zinc-200'}>
                        {item.stock_pcs} {item.unit_retail}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        ({dusCount} {item.unit_wholesale} {sisaPcs > 0 ? `+ ${sisaPcs} ${item.unit_retail}` : ''})
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {permissions.canEditInventory ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setRestockItem(item);
                              setRestockQty(1);
                              setRestockUnit('wholesale');
                            }}
                            className="bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-300 text-[10px] px-2 py-1 rounded-none cursor-pointer"
                            title="Restock Tambah Stok"
                          >
                            +Stok
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                            title="Edit Barang"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 cursor-pointer"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-mono">Lihat Saja</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-2xl rounded-none shadow-2xl p-6 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h2 className="font-mono font-bold text-sm uppercase text-emerald-400">
                {editingItem ? 'Edit Data Barang Grosir' : 'Tambah Barang Baru ke Katalog'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="border border-zinc-800 p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs font-mono mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Barcode */}
                <div>
                  <label className="block text-zinc-400 mb-1">Kode Barcode (EAN-13 / Code 128):</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      required
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="899..."
                      className="flex-1 bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, barcode: '899' + Math.floor(1000000000 + Math.random() * 9000000000) })}
                      className="bg-zinc-800 text-zinc-300 px-2 py-1 border border-zinc-700 hover:bg-zinc-700 cursor-pointer text-[10px]"
                    >
                      Acak
                    </button>
                  </div>
                </div>

                {/* Nama Barang */}
                <div>
                  <label className="block text-zinc-400 mb-1">Nama Barang:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Indomie Goreng Spesial 85g"
                    className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-zinc-400 mb-1">Kategori:</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none"
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-zinc-400 mb-1">Pemasok / Supplier:</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none focus:outline-none"
                  >
                    <option value="">Pilih Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name} ({s.payment_terms})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Wholesale and Retail Specs */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Variasi Harga & Konversi Satuan Grosir
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">Satuan Eceran:</label>
                    <input
                      type="text"
                      value={formData.unit_retail}
                      onChange={(e) => setFormData({ ...formData, unit_retail: e.target.value })}
                      placeholder="Pcs / Bks / Kg"
                      className="w-full bg-black border border-zinc-700 px-2 py-1 text-white rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">Satuan Grosir:</label>
                    <input
                      type="text"
                      value={formData.unit_wholesale}
                      onChange={(e) => setFormData({ ...formData, unit_wholesale: e.target.value })}
                      placeholder="Dus / Krt / Sak"
                      className="w-full bg-black border border-zinc-700 px-2 py-1 text-white rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">Isi Per Dus (Pcs):</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.pieces_per_wholesale}
                      onChange={(e) => setFormData({ ...formData, pieces_per_wholesale: Number(e.target.value) })}
                      className="w-full bg-black border border-zinc-700 px-2 py-1 text-white rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">Min Beli Grosir:</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.wholesale_min_qty}
                      onChange={(e) => setFormData({ ...formData, wholesale_min_qty: Number(e.target.value) })}
                      className="w-full bg-black border border-zinc-700 px-2 py-1 text-white rounded-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">Harga Beli Modal (Rp):</label>
                    <input
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                      className="w-full bg-black border border-zinc-700 px-2 py-1 text-white rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-emerald-400 mb-0.5">Harga Jual Eceran (Rp):</label>
                    <input
                      type="number"
                      value={formData.retail_price}
                      onChange={(e) => setFormData({ ...formData, retail_price: Number(e.target.value) })}
                      className="w-full bg-black border border-emerald-600 px-2 py-1 text-emerald-300 rounded-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-amber-400 mb-0.5">Harga Jual Grosir (Rp):</label>
                    <input
                      type="number"
                      value={formData.wholesale_price}
                      onChange={(e) => setFormData({ ...formData, wholesale_price: Number(e.target.value) })}
                      className="w-full bg-black border border-amber-600 px-2 py-1 text-amber-300 rounded-none font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Stock and Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">
                    Stok Awal (dalam {formData.unit_retail}):
                  </label>
                  <input
                    type="number"
                    value={formData.stock_pcs}
                    onChange={(e) => setFormData({ ...formData, stock_pcs: Number(e.target.value) })}
                    className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    = {Math.floor(formData.stock_pcs / (formData.pieces_per_wholesale || 1))} {formData.unit_wholesale}
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    Peringatan Minimum Stok ({formData.unit_retail}):
                  </label>
                  <input
                    type="number"
                    value={formData.min_stock_alert}
                    onChange={(e) => setFormData({ ...formData, min_stock_alert: Number(e.target.value) })}
                    className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="border border-zinc-700 px-4 py-2 text-zinc-400 hover:text-white rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-none cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      {restockItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-md rounded-none shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <h2 className="font-mono font-bold text-sm uppercase text-sky-400">
                Tambah Stok Barang Masuk
              </h2>
              <button
                onClick={() => setRestockItem(null)}
                className="border border-zinc-800 p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-900 p-3 border border-zinc-800 text-xs font-mono mb-4">
              <div className="font-bold text-white mb-1">{restockItem.name}</div>
              <div className="text-zinc-400">
                Stok Sekarang: <strong className="text-emerald-400">{restockItem.stock_pcs} {restockItem.unit_retail}</strong>
              </div>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Jumlah Yang Masuk:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-black border border-zinc-700 px-3 py-2 text-base font-bold text-white rounded-none"
                    autoFocus
                  />
                  <select
                    value={restockUnit}
                    onChange={(e) => setRestockUnit(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-white rounded-none"
                  >
                    <option value="wholesale">{restockItem.unit_wholesale} (Isi {restockItem.pieces_per_wholesale} {restockItem.unit_retail})</option>
                    <option value="retail">{restockItem.unit_retail}</option>
                  </select>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Total penambahan: {restockUnit === 'wholesale' ? restockQty * restockItem.pieces_per_wholesale : restockQty} {restockItem.unit_retail}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="border border-zinc-700 px-3 py-2 text-zinc-400 hover:text-white rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-none cursor-pointer"
                >
                  Konfirmasi Masuk Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
