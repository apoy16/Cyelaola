export interface CartItem {
  id: number;
  barcode: string;
  name: string;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  wholesale_min_qty: number;
  unit_retail: string;
  unit_wholesale: string;
  pieces_per_wholesale: number;
  stock_pcs: number;
  // Cart state
  unit_type: 'retail' | 'wholesale'; // 'retail' = per pcs/bks, 'wholesale' = per dus/karton
  quantity: number; // in current unit_type
}

/**
 * Determine effective unit price and multiplier for an item based on unit type
 */
export function getItemPricing(item: {
  retail_price: number;
  wholesale_price: number;
  pieces_per_wholesale: number;
  unit_type: 'retail' | 'wholesale';
}) {
  if (item.unit_type === 'wholesale') {
    return {
      unitPrice: item.wholesale_price,
      multiplierToPcs: Math.max(1, item.pieces_per_wholesale),
    };
  }
  return {
    unitPrice: item.retail_price,
    multiplierToPcs: 1,
  };
}

/**
 * Calculate total pieces needed for a cart item
 */
export function calculateItemTotalPcs(quantity: number, multiplierToPcs: number): number {
  return Math.max(0, quantity) * Math.max(1, multiplierToPcs);
}

/**
 * Calculate line item subtotal
 */
export function calculateLineSubtotal(quantity: number, unitPrice: number): number {
  return Math.max(0, quantity) * Math.max(0, unitPrice);
}

/**
 * Calculate cart summary totals
 */
export function calculateCartTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  discount: number = 0
): {
  totalItems: number;
  subtotal: number;
  discount: number;
  grandTotal: number;
} {
  let totalItems = 0;
  let subtotal = 0;

  for (const item of items) {
    const qty = Math.max(0, item.quantity);
    totalItems += qty;
    subtotal += qty * Math.max(0, item.unitPrice);
  }

  const validDiscount = Math.max(0, Math.min(discount, subtotal));
  const grandTotal = Math.max(0, subtotal - validDiscount);

  return {
    totalItems,
    subtotal,
    discount: validDiscount,
    grandTotal,
  };
}

/**
 * Calculate change due
 */
export function calculateChangeDue(grandTotal: number, amountPaid: number): {
  changeDue: number;
  isSufficient: boolean;
  shortage: number;
} {
  const gTotal = Math.max(0, grandTotal);
  const paid = Math.max(0, amountPaid);
  const diff = paid - gTotal;

  if (diff >= 0) {
    return {
      changeDue: diff,
      isSufficient: true,
      shortage: 0,
    };
  } else {
    return {
      changeDue: 0,
      isSufficient: false,
      shortage: Math.abs(diff),
    };
  }
}

/**
 * Currency formatter for Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(seqNumber: number, date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(seqNumber).padStart(4, '0');
  return `INV-${yyyy}${mm}${dd}-${seq}`;
}
