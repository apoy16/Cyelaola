import React from 'react';
import { Transaction, StoreSettings } from '../types';
import { formatRupiah } from '../utils/pos-calculations';
import { Printer, X } from 'lucide-react';

interface ThermalReceiptProps {
  transaction: Transaction;
  settings: StoreSettings;
  onClose?: () => void;
  onPrint?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  transaction,
  settings,
  onClose,
  onPrint,
}) => {
  const is80mm = settings.paper_size === '80mm';

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-black rounded-none shadow-2xl border-2 border-black max-w-md w-full p-4 print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-dashed border-gray-300 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">
              Format {settings.paper_size || '58mm'}
            </span>
            <span className="text-xs text-gray-500 font-mono">Thermal Receipt</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrint}
              className="bg-black hover:bg-zinc-800 text-white font-mono text-xs px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak (Ctrl+P)
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="border border-black hover:bg-gray-100 p-1.5 text-black transition-colors cursor-pointer"
                aria-label="Tutup preview struk"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div
          id="printable-receipt"
          className={`font-mono text-xs mx-auto leading-tight bg-white p-2 ${
            is80mm ? 'w-[76mm] max-w-[76mm]' : 'w-[54mm] max-w-[54mm]'
          } print:w-full print:max-w-full`}
        >
          {/* HEADER */}
          <div className="text-center pb-2 border-b border-dashed border-black">
            <h1 className="font-bold text-sm uppercase tracking-wide">{settings.store_name}</h1>
            <p className="text-[10px] mt-0.5 text-gray-800">{settings.address}</p>
            <p className="text-[10px] text-gray-800">{settings.city} | Telp: {settings.phone}</p>
          </div>

          {/* META INFO */}
          <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span>No. Inv</span>
              <span className="font-bold">{transaction.invoice_no}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu</span>
              <span>{new Date(transaction.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir</span>
              <span>{transaction.cashier_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan</span>
              <span>{transaction.customer_name}</span>
            </div>
          </div>

          {/* ITEM LIST */}
          <div className="py-2 border-b border-dashed border-black space-y-1.5">
            {transaction.details?.map((detail, idx) => (
              <div key={idx} className="text-[11px]">
                <div className="font-semibold truncate">{detail.item_name}</div>
                <div className="flex justify-between items-center text-[10px] text-gray-800">
                  <span>
                    {detail.quantity} {detail.unit_name} x {detail.unit_price.toLocaleString('id-ID')}
                    {detail.pricing_type === 'wholesale' ? ' (Grosir)' : ''}
                  </span>
                  <span className="font-bold">{detail.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* TOTALS */}
          <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatRupiah(transaction.subtotal)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon:</span>
                <span>-{formatRupiah(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-gray-400">
              <span>TOTAL AKHIR:</span>
              <span>{formatRupiah(transaction.grand_total)}</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="uppercase">Bayar ({transaction.payment_method}):</span>
              <span>{formatRupiah(transaction.amount_paid)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Kembalian:</span>
              <span>{formatRupiah(transaction.change_due)}</span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="text-center pt-2.5 text-[9px] text-gray-700 whitespace-pre-line leading-relaxed">
            {settings.receipt_footer}
            <div className="mt-2 text-[8px] text-gray-400 font-sans uppercase tracking-widest">
              --- Toko Grosir Modern POS ---
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
