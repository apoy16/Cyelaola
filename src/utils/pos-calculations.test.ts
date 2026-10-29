import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getItemPricing,
  calculateItemTotalPcs,
  calculateLineSubtotal,
  calculateCartTotals,
  calculateChangeDue,
  formatRupiah,
  generateInvoiceNumber,
} from './pos-calculations';

test('getItemPricing returns retail price and multiplier 1 for retail mode', () => {
  const item = {
    retail_price: 3500,
    wholesale_price: 130000,
    pieces_per_wholesale: 40,
    unit_type: 'retail' as const,
  };
  const pricing = getItemPricing(item);
  assert.equal(pricing.unitPrice, 3500);
  assert.equal(pricing.multiplierToPcs, 1);
});

test('getItemPricing returns wholesale price and correct multiplier for wholesale mode', () => {
  const item = {
    retail_price: 3500,
    wholesale_price: 130000,
    pieces_per_wholesale: 40,
    unit_type: 'wholesale' as const,
  };
  const pricing = getItemPricing(item);
  assert.equal(pricing.unitPrice, 130000);
  assert.equal(pricing.multiplierToPcs, 40);
});

test('calculateItemTotalPcs correctly computes pieces conversion', () => {
  assert.equal(calculateItemTotalPcs(5, 40), 200); // 5 dus x 40 pcs = 200 pcs
  assert.equal(calculateItemTotalPcs(3, 1), 3); // 3 pcs x 1 = 3 pcs
  assert.equal(calculateItemTotalPcs(-1, 24), 0);
});

test('calculateLineSubtotal multiplies quantity with unit price', () => {
  assert.equal(calculateLineSubtotal(2, 130000), 260000);
  assert.equal(calculateLineSubtotal(10, 3500), 35000);
  assert.equal(calculateLineSubtotal(0, 10000), 0);
});

test('calculateCartTotals calculates subtotal, capped discount, and grand total', () => {
  const items = [
    { quantity: 2, unitPrice: 130000 }, // 260000
    { quantity: 5, unitPrice: 15000 },  // 75000
  ];
  const totals = calculateCartTotals(items, 15000);
  assert.equal(totals.totalItems, 7);
  assert.equal(totals.subtotal, 335000);
  assert.equal(totals.discount, 15000);
  assert.equal(totals.grandTotal, 320000);

  // Discount capped to subtotal
  const overDiscount = calculateCartTotals(items, 500000);
  assert.equal(overDiscount.discount, 335000);
  assert.equal(overDiscount.grandTotal, 0);
});

test('calculateChangeDue computes change and sufficiency properly', () => {
  const sufficient = calculateChangeDue(320000, 350000);
  assert.equal(sufficient.isSufficient, true);
  assert.equal(sufficient.changeDue, 30000);
  assert.equal(sufficient.shortage, 0);

  const exact = calculateChangeDue(320000, 320000);
  assert.equal(exact.isSufficient, true);
  assert.equal(exact.changeDue, 0);
  assert.equal(exact.shortage, 0);

  const insufficient = calculateChangeDue(320000, 300000);
  assert.equal(insufficient.isSufficient, false);
  assert.equal(insufficient.changeDue, 0);
  assert.equal(insufficient.shortage, 20000);
});

test('formatRupiah formats currency according to Indonesian format', () => {
  const formatted = formatRupiah(150000);
  assert.ok(formatted.includes('150.000'));
  assert.equal(formatRupiah(0), 'Rp 0');
});

test('generateInvoiceNumber formats sequential invoice codes', () => {
  const d = new Date(2026, 9, 29); // Oct 29, 2026
  const inv = generateInvoiceNumber(42, d);
  assert.equal(inv, 'INV-20261029-0042');
});
