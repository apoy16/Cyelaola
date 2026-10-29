import React, { useState, useRef, useEffect } from 'react';
import {
  Barcode,
  Search,
  Camera,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Banknote,
  Clock,
  Printer,
  ShoppingBag,
  Check,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Item, CartItem, Transaction, StoreSettings, User } from '../types';
import { api } from '../services/api';
import { formatRupiah, calculateChangeDue } from '../utils/pos-calculations';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import { ThermalReceipt } from './ThermalReceipt';

interface CashierTabProps {
  items: Item[];
  settings: StoreSettings;
  currentUser: User;
  onTransactionComplete: () => void;
}

export const CashierTab: React.FC<CashierTabProps> = ({
  items,
  settings,
  currentUser,
  onTransactionComplete,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [cashierName, setCashierName] = useState(currentUser.name || 'Kasir Grosir');
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer' | 'tempo'>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Receipt Preview state
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Persistent autofocus on barcode input
  useEffect(() => {
    if (!checkoutModalOpen && !searchModalOpen && !cameraScannerOpen && !completedTx) {
      barcodeInputRef.current?.focus();
    }
  }, [checkoutModalOpen, searchModalOpen, cameraScannerOpen, completedTx, cart]);

  // Handle adding an item to the cart
  const addItemToCart = (item: Item, forcedUnit?: 'retail' | 'wholesale') => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((ci) => ci.id === item.id);
      const unitType: 'retail' | 'wholesale' = forcedUnit || 'retail';
      const unitPrice = unitType === 'wholesale' ? item.wholesale_price : item.retail_price;
      const unitName = unitType === 'wholesale' ? item.unit_wholesale : item.unit_retail;
      const multiplier = unitType === 'wholesale' ? item.pieces_per_wholesale : 1;

      if (existingIdx >= 0) {
        const updated = [...prevCart];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + 1;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          subtotal: newQty * existing.unit_price,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            id: item.id,
            barcode: item.barcode,
            name: item.name,
            cost_price: item.cost_price,
            retail_price: item.retail_price,
            wholesale_price: item.wholesale_price,
            wholesale_min_qty: item.wholesale_min_qty,
            unit_retail: item.unit_retail,
            unit_wholesale: item.unit_wholesale,
            pieces_per_wholesale: item.pieces_per_wholesale,
            stock_pcs: item.stock_pcs,
            pricing_type: unitType,
            unit_name: unitName,
            quantity: 1,
            multiplier_to_pcs: multiplier,
            unit_price: unitPrice,
            subtotal: unitPrice,
          },
        ];
      }
    });

    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Toggle between wholesale (Dus/Karton) and retail (Pcs/Bks)
  const toggleItemUnit = (index: number) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      const item = updated[index];
      const newType = item.pricing_type === 'retail' ? 'wholesale' : 'retail';
      const newPrice = newType === 'wholesale' ? item.wholesale_price : item.retail_price;
      const newUnitName = newType === 'wholesale' ? item.unit_wholesale : item.unit_retail;
      const newMultiplier = newType === 'wholesale' ? item.pieces_per_wholesale : 1;

      updated[index] = {
        ...item,
        pricing_type: newType,
        unit_name: newUnitName,
        multiplier_to_pcs: newMultiplier,
        unit_price: newPrice,
        subtotal: item.quantity * newPrice,
      };
      return updated;
    });
  };

  // Change quantity
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prevCart) => {
      const updated = [...prevCart];
      const item = updated[index];
      updated[index] = {
        ...item,
        quantity: newQty,
        subtotal: newQty * item.unit_price,
      };
      return updated;
    });
  };

  // Remove item
  const removeFromCart = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
    barcodeInputRef.current?.focus();
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Kosongkan semua daftar belanja kasir?')) {
      setCart([]);
      setDiscount(0);
      barcodeInputRef.current?.focus();
    }
  };

  // Process barcode input (from USB scanner or keyboard Enter)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    // Search exact barcode
    const found = items.find(
      (it) => it.barcode.toLowerCase() === query.toLowerCase() || it.name.toLowerCase() === query.toLowerCase()
    );

    if (found) {
      addItemToCart(found);
    } else {
      // Partial match search
      const partial = items.find((it) => it.name.toLowerCase().includes(query.toLowerCase()));
      if (partial) {
        addItemToCart(partial);
      } else {
        alert(`Barang dengan kode/barcode "${query}" tidak ditemukan di database`);
      }
    }
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Cart calculations
  const totalItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  // Open checkout modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setErrorMessage(null);
    setAmountPaidInput(grandTotal.toString());
    setCheckoutModalOpen(true);
  };

  // Quick cash buttons
  const handleQuickCash = (amount: number) => {
    setAmountPaidInput(amount.toString());
  };

  const parsedPaid = Number(amountPaidInput) || 0;
  const changeInfo = calculateChangeDue(grandTotal, parsedPaid);

  // Submit transaction to backend
  const handleProcessTransaction = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'cash' && !changeInfo.isSufficient) {
      setErrorMessage(`Uang pembayaran kurang ${formatRupiah(changeInfo.shortage)}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        cashier_name: cashierName,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cart,
        discount: discount,
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'cash' ? parsedPaid : grandTotal,
        notes: notes,
      };

      const res = await api.createTransaction(payload);
      const newTx: Transaction = res;

      // Close checkout modal
      setCheckoutModalOpen(false);

      // Trigger Direct Thermal Auto-Print if configured
      if (settings.auto_print) {
        setTimeout(() => {
          window.print();
        }, 200);
      }

      // Show receipt preview & trigger parent reload
      setCompletedTx(newTx);
      setCart([]);
      setDiscount(0);
      setNotes('');
      onTransactionComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* LEFT SECTION: SCANNER & CART */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-hidden">
        {/* TOP BAR: BARCODE AUTO-FOCUS INPUT & QUICK SHORTCUTS */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Barcode className="h-5 w-5 text-emerald-400" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode (USB / Laser Scanner) atau Ketik Kode / Nama Produk..."
                className="w-full pl-10 pr-4 py-3 bg-black border-2 border-emerald-500 font-mono text-base text-white placeholder-zinc-500 rounded-none focus:outline-none focus:ring-1 focus:ring-emerald-400"
                autoComplete="off"
              />
              <span className="absolute right-3 top-3 text-[10px] font-mono text-emerald-400/80 bg-zinc-900 px-1.5 py-0.5 border border-emerald-800 hidden sm:inline-block">
                AUTO-FOCUS AKTIF
              </span>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold px-4 py-3.5 rounded-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>Enter (Tambah)</span>
            </button>

            <button
              type="button"
              onClick={() => setCameraScannerOpen(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-3 rounded-none flex items-center gap-1.5 cursor-pointer text-xs font-mono"
              title="Scan Barcode via Kamera HP/Webcam"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Kamera</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-3 rounded-none flex items-center gap-1.5 cursor-pointer text-xs font-mono"
              title="Cari Manual dari Katalog"
            >
              <Search className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Katalog</span>
            </button>
          </form>

          {/* Quick Wholesale Notice */}
          <div className="flex items-center justify-between mt-2 pt-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">Toko Grosir Mode:</span>
              <span>Klik badge satuan (Ecer/Dus) pada item untuk switch harga grosir instan.</span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan ({cart.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* CART TABLE LIST */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-600">
              <ShoppingBag className="w-16 h-16 mb-3 opacity-30 text-emerald-400" />
              <p className="font-mono text-sm text-zinc-400 uppercase tracking-wider font-semibold">
                Keranjang Kasir Masih Kosong
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Arahkan scanner barcode ke kemasan barang grosir/eceran atau gunakan tombol Katalog di atas.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, index) => {
                const totalPcsNeeded = item.quantity * item.multiplier_to_pcs;
                const isStockInsufficient = totalPcsNeeded > item.stock_pcs;

                return (
                  <div
                    key={`${item.id}-${item.pricing_type}`}
                    className={`bg-zinc-900 border ${
                      isStockInsufficient ? 'border-amber-500/80' : 'border-zinc-800'
                    } p-3 rounded-none transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                  >
                    {/* Item info & mode toggle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-zinc-400 bg-black px-1.5 py-0.5 border border-zinc-800">
                          {item.barcode}
                        </span>
                        {/* TOGGLE UNIT / PRICING BUTTON */}
                        <button
                          type="button"
                          onClick={() => toggleItemUnit(index)}
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 border cursor-pointer transition-colors ${
                            item.pricing_type === 'wholesale'
                              ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                              : 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                          }`}
                          title="Klik untuk beralih antara Eceran vs Grosir"
                        >
                          Mode: {item.pricing_type === 'wholesale' ? `GROSIR (${item.unit_wholesale})` : `ECERAN (${item.unit_retail})`}
                        </button>

                        {isStockInsufficient && (
                          <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Stok kurang ({item.stock_pcs} {item.unit_retail} sisa)
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-sm text-zinc-100 truncate mt-1">
                        {item.name}
                      </h3>

                      <div className="text-xs text-zinc-400 font-mono mt-0.5">
                        {formatRupiah(item.unit_price)} / {item.unit_name}
                        {item.pricing_type === 'wholesale' && (
                          <span className="text-zinc-500 ml-1 text-[11px]">
                            (Isi {item.pieces_per_wholesale} {item.unit_retail} = setara {formatRupiah(Math.round(item.unit_price / item.pieces_per_wholesale))}/{item.unit_retail})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls & Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {/* Qty +/- */}
                      <div className="flex items-center border border-zinc-700 bg-black">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-1.5 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                          aria-label="Kurang qty"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-14 text-center font-mono text-sm bg-transparent text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="p-1.5 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                          aria-label="Tambah qty"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-right min-w-[100px]">
                        <div className="font-mono font-bold text-sm text-emerald-400">
                          {formatRupiah(item.subtotal)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {totalPcsNeeded} {item.unit_retail}
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: TOTALS & CHECKOUT PANEL */}
      <div className="w-full lg:w-96 bg-zinc-900 flex flex-col justify-between border-t lg:border-t-0 border-zinc-800 p-4">
        <div className="space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-400">
              Informasi Transaksi Kasir
            </h2>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-[10px] text-zinc-400 font-mono block">Nama Kasir:</label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full bg-black border border-zinc-700 px-2 py-1 text-xs font-mono text-zinc-200 rounded-none focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-mono block">Nama Pelanggan:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-black border border-zinc-700 px-2 py-1 text-xs font-mono text-zinc-200 rounded-none focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* TOTAL BREAKDOWN */}
          <div className="bg-black border border-zinc-800 p-4 space-y-3 font-mono">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Total Item:</span>
              <span className="font-bold text-zinc-200">{totalItemsCount} Unit ({cart.length} Jenis)</span>
            </div>

            <div className="flex justify-between text-xs text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-bold text-zinc-200">{formatRupiah(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-xs text-zinc-400 pt-1 border-t border-zinc-800">
              <span>Potongan / Diskon (Rp):</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-24 text-right bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-amber-400 font-mono rounded-none focus:outline-none"
              />
            </div>

            {/* GRAND TOTAL */}
            <div className="pt-2 border-t border-dashed border-zinc-700">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 block font-bold">
                Grand Total Pembayaran
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-0.5">
                {formatRupiah(grandTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* CHECKOUT ACTION BUTTON */}
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
            className={`w-full py-4 text-center font-mono font-bold text-sm tracking-wider uppercase rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              cart.length === 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-950'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Bayar Sekarang (F9)</span>
          </button>

          <div className="text-[10px] text-center text-zinc-500 font-mono">
            Direct Thermal Printing: {settings.auto_print ? 'Aktif (Auto-Print)' : 'Manual Preview'}
          </div>
        </div>
      </div>

      {/* CHECKOUT & PAYMENT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-lg rounded-none shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="font-mono font-bold text-base uppercase text-emerald-400">
                Penyelesaian Pembayaran
              </h2>
              <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-400">
                Total: {formatRupiah(grandTotal)}
              </span>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* PAYMENT METHOD TABS */}
            <div className="grid grid-cols-4 gap-1 mt-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 text-xs font-mono font-bold border rounded-none cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-2 text-xs font-mono font-bold border rounded-none cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'qris'
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-2 text-xs font-mono font-bold border rounded-none cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'transfer'
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('tempo')}
                className={`py-2 text-xs font-mono font-bold border rounded-none cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'tempo'
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Tempo Grosir</span>
              </button>
            </div>

            {/* CASH PAYMENT SECTION */}
            {paymentMethod === 'cash' && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1">
                    Uang Tunai Diterima (Rp):
                  </label>
                  <input
                    type="number"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-full bg-black border-2 border-zinc-700 px-3 py-2 text-xl font-mono font-bold text-white focus:outline-none focus:border-emerald-500 rounded-none"
                    autoFocus
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(grandTotal)}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs font-mono text-emerald-400 cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000, 500000, 1000000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => handleQuickCash(nominal)}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-mono text-zinc-300 cursor-pointer"
                    >
                      {formatRupiah(nominal)}
                    </button>
                  ))}
                </div>

                {/* Change display */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 flex justify-between items-center font-mono">
                  <span className="text-xs text-zinc-400 uppercase">Kembalian:</span>
                  <span
                    className={`text-xl font-bold ${
                      changeInfo.isSufficient ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {changeInfo.isSufficient
                      ? formatRupiah(changeInfo.changeDue)
                      : `Kurang ${formatRupiah(changeInfo.shortage)}`}
                  </span>
                </div>
              </div>
            )}

            {/* QRIS SECTION */}
            {paymentMethod === 'qris' && (
              <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 text-center space-y-2">
                <div className="inline-block p-3 bg-white text-black font-mono">
                  <QrCode className="w-28 h-28 mx-auto" />
                  <div className="text-[10px] font-bold mt-1 tracking-widest">QRIS STATIS TOKO</div>
                </div>
                <div className="text-xs font-mono text-zinc-300">
                  Tagihan: <strong className="text-emerald-400">{formatRupiah(grandTotal)}</strong>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Pelanggan scan QRIS melalui BCA, GoPay, OVO, Dana, ShopeePay, atau Bank Mandiri.
                </p>
              </div>
            )}

            {/* TRANSFER / TEMPO SECTION */}
            {(paymentMethod === 'transfer' || paymentMethod === 'tempo') && (
              <div className="mt-4 space-y-2">
                <label className="text-xs font-mono text-zinc-400 block">
                  Catatan / Nomor Referensi / Jatuh Tempo:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={paymentMethod === 'tempo' ? 'Contoh: Jatuh tempo 14 hari, warung Jl. Mawar' : 'Contoh: Transfer Bank BCA an PT Grosir'}
                  className="w-full bg-black border border-zinc-700 p-2 text-xs font-mono text-white rounded-none focus:outline-none"
                />
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="flex-1 border border-zinc-700 py-3 text-xs font-mono text-zinc-400 hover:text-white rounded-none cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSubmitting || (paymentMethod === 'cash' && !changeInfo.isSufficient)}
                onClick={handleProcessTransaction}
                className="flex-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono font-bold text-xs py-3 rounded-none flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses...' : 'Selesaikan & Cetak Struk'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATALOG SEARCH MODAL */}
      {searchModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 text-white border-2 border-zinc-700 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-none shadow-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="font-mono font-bold text-sm uppercase text-sky-400">
                Pilih Produk dari Katalog Grosir
              </h2>
              <button
                onClick={() => setSearchModalOpen(false)}
                className="text-zinc-400 hover:text-white border border-zinc-800 p-1 cursor-pointer"
              >
                Tutup [Esc]
              </button>
            </div>

            <div className="py-2 overflow-y-auto flex-1 space-y-2 mt-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="p-2.5 bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-400 bg-black px-1.5 py-0.5">
                        {it.barcode}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Stok: {it.stock_pcs} {it.unit_retail} ({Math.floor(it.stock_pcs / it.pieces_per_wholesale)} {it.unit_wholesale})
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-white truncate mt-0.5">{it.name}</div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5 flex gap-3">
                      <span>Eceran: <strong className="text-emerald-400">{formatRupiah(it.retail_price)}</strong>/{it.unit_retail}</span>
                      <span>Grosir: <strong className="text-amber-400">{formatRupiah(it.wholesale_price)}</strong>/{it.unit_wholesale}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        addItemToCart(it, 'retail');
                        setSearchModalOpen(false);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-[11px] px-2.5 py-1.5 rounded-none cursor-pointer"
                    >
                      + Eceran
                    </button>
                    <button
                      onClick={() => {
                        addItemToCart(it, 'wholesale');
                        setSearchModalOpen(false);
                      }}
                      className="bg-amber-700 hover:bg-amber-600 text-white font-mono text-[11px] px-2.5 py-1.5 rounded-none cursor-pointer"
                    >
                      + Grosir ({it.unit_wholesale})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CAMERA SCANNER MODAL */}
      {cameraScannerOpen && (
        <CameraBarcodeScanner
          onScan={(code) => {
            setCameraScannerOpen(false);
            setBarcodeInput(code);
            // Auto find
            const found = items.find((i) => i.barcode === code.trim());
            if (found) {
              addItemToCart(found);
            } else {
              alert(`Barcode ${code} tidak ada dalam database`);
            }
          }}
          onClose={() => setCameraScannerOpen(false)}
        />
      )}

      {/* COMPLETED TRANSACTION THERMAL RECEIPT PREVIEW */}
      {completedTx && (
        <ThermalReceipt
          transaction={completedTx}
          settings={settings}
          onClose={() => {
            setCompletedTx(null);
            barcodeInputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};
