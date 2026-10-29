import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Eye,
  RotateCcw,
  Printer,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Transaction, StoreSettings, UserRole } from '../types';
import { api } from '../services/api';
import { formatRupiah } from '../utils/pos-calculations';
import { getRolePermissions } from '../utils/auth-permissions';
import { ThermalReceipt } from './ThermalReceipt';

interface TransactionsTabProps {
  settings: StoreSettings;
  userRole: UserRole;
  onRefreshNeeded: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ settings, userRole, onRefreshNeeded }) => {
  const permissions = getRolePermissions(userRole);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions({
        search: searchTerm,
        start_date: startDate,
        end_date: endDate,
      });
      setTransactions(data);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [searchTerm, startDate, endDate]);

  const handleOpenDetail = async (id: number) => {
    try {
      const detail = await api.getTransactionDetail(id);
      setSelectedTx(detail);
    } catch (err: any) {
      alert('Gagal mengambil detail transaksi: ' + err.message);
    }
  };

  const handleOpenReceipt = async (id: number) => {
    try {
      const detail = await api.getTransactionDetail(id);
      setReceiptTx(detail);
    } catch (err: any) {
      alert('Gagal memuat struk: ' + err.message);
    }
  };

  const handleCancelTransaction = async (id: number, invoiceNo: string) => {
    if (
      !confirm(
        `PERINGATAN: Batalkan transaksi ${invoiceNo}?\n\nSemua barang dalam transaksi ini akan otomatis dikembalikan ke stok etalase/gudang.`
      )
    ) {
      return;
    }

    try {
      setIsVoiding(true);
      await api.cancelTransaction(id);
      alert(`Transaksi ${invoiceNo} berhasil dibatalkan dan stok telah direstore.`);
      if (selectedTx?.id === id) {
        setSelectedTx(null);
      }
      fetchTransactions();
      onRefreshNeeded();
    } catch (err: any) {
      alert('Gagal membatalkan transaksi: ' + err.message);
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* TOOLBAR */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-400" />
          <h2 className="font-mono font-bold text-sm uppercase tracking-wider">
            Riwayat Transaksi Penjualan ({transactions.length})
          </h2>
        </div>
      </div>

      {/* FILTERS */}
      <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari No. Invoice atau Nama Pelanggan..."
            className="w-full pl-9 pr-3 py-1.5 bg-black border border-zinc-700 text-xs font-mono text-white rounded-none focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400">Dari:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-black border border-zinc-700 text-xs font-mono text-zinc-200 px-2 py-1 rounded-none focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400">Sampai:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-black border border-zinc-700 text-xs font-mono text-zinc-200 px-2 py-1 rounded-none focus:outline-none"
          />
        </div>

        {(searchTerm || startDate || endDate) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 border border-zinc-800 cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-black text-zinc-400 border-b border-zinc-800">
              <th className="p-3 font-semibold">No. Invoice</th>
              <th className="p-3 font-semibold">Tanggal & Waktu</th>
              <th className="p-3 font-semibold">Pelanggan</th>
              <th className="p-3 font-semibold text-center">Jml Item</th>
              <th className="p-3 font-semibold text-right">Total Transaksi</th>
              <th className="p-3 font-semibold text-center">Metode</th>
              <th className="p-3 font-semibold text-center">Status</th>
              <th className="p-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  Memuat riwayat transaksi...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  Belum ada transaksi yang tercatat.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3 font-bold text-white">
                    <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5">
                      {tx.invoice_no}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-400">
                    {new Date(tx.created_at).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="p-3 text-zinc-300 font-sans font-medium">
                    {tx.customer_name}
                  </td>
                  <td className="p-3 text-center text-zinc-400">{tx.total_items_count}</td>
                  <td className="p-3 text-right font-bold text-emerald-400">
                    {formatRupiah(tx.grand_total)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="uppercase text-[10px] bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-zinc-300">
                      {tx.payment_method}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {tx.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        SELESAI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-950/50 border border-red-800 px-2 py-0.5 font-bold">
                        <XCircle className="w-3 h-3" />
                        BATAL / VOID
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenDetail(tx.id)}
                        className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                        title="Lihat Detail Transaksi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenReceipt(tx.id)}
                        className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 cursor-pointer"
                        title="Cetak Ulang Struk Thermal"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {tx.status === 'completed' && permissions.canVoidTransactions && (
                        <button
                          onClick={() => handleCancelTransaction(tx.id, tx.invoice_no)}
                          className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 cursor-pointer"
                          title="Batalkan Transaksi & Kembalikan Stok (Admin / Manager)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-2xl rounded-none shadow-2xl p-6 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h2 className="font-mono font-bold text-sm uppercase">
                  Detail Transaksi: {selectedTx.invoice_no}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="border border-zinc-800 p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-900 border border-zinc-800 font-mono text-xs mb-4">
              <div>
                <span className="text-zinc-500 block text-[10px]">Waktu:</span>
                <span>{new Date(selectedTx.created_at).toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Pelanggan:</span>
                <span>{selectedTx.customer_name}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Metode Bayar:</span>
                <span className="uppercase font-bold">{selectedTx.payment_method}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Status:</span>
                <span className={selectedTx.status === 'completed' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {selectedTx.status === 'completed' ? 'SUKSES' : 'DIBATALKAN'}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-zinc-800 mb-4">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-black text-zinc-400 border-b border-zinc-800">
                    <th className="p-2">Barang</th>
                    <th className="p-2 text-center">Tipe</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Harga Satuan</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {selectedTx.details?.map((d) => (
                    <tr key={d.id}>
                      <td className="p-2 font-sans font-medium text-zinc-200">
                        {d.item_name}
                        <div className="text-[10px] font-mono text-zinc-500">{d.barcode}</div>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 border ${
                          d.pricing_type === 'wholesale'
                            ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                            : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                        }`}>
                          {d.pricing_type === 'wholesale' ? 'Grosir' : 'Eceran'}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        {d.quantity} {d.unit_name}
                        {d.pricing_type === 'wholesale' && (
                          <div className="text-[10px] text-zinc-500 font-mono">({d.total_pcs} Pcs)</div>
                        )}
                      </td>
                      <td className="p-2 text-right text-zinc-300">{formatRupiah(d.unit_price)}</td>
                      <td className="p-2 text-right font-bold text-white">{formatRupiah(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total summary */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span>{formatRupiah(selectedTx.subtotal)}</span>
              </div>
              {selectedTx.discount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(selectedTx.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-emerald-400 pt-1 border-t border-zinc-800">
                <span>Total Akhir:</span>
                <span>{formatRupiah(selectedTx.grand_total)}</span>
              </div>
              <div className="flex justify-between text-zinc-300 pt-1 border-t border-dotted border-zinc-700">
                <span>Jumlah Bayar:</span>
                <span>{formatRupiah(selectedTx.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Kembalian:</span>
                <span>{formatRupiah(selectedTx.change_due)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 mt-4 pt-3 border-t border-zinc-800">
              {selectedTx.status === 'completed' && (
                <button
                  type="button"
                  disabled={isVoiding}
                  onClick={() => handleCancelTransaction(selectedTx.id, selectedTx.invoice_no)}
                  className="bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 text-xs font-mono font-bold px-3 py-2 rounded-none flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batalkan / Void Transaksi</span>
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setReceiptTx(selectedTx);
                    setSelectedTx(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold px-4 py-2 rounded-none flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Struk Thermal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPRINT RECEIPT MODAL */}
      {receiptTx && (
        <ThermalReceipt
          transaction={receiptTx}
          settings={settings}
          onClose={() => setReceiptTx(null)}
        />
      )}
    </div>
  );
};
