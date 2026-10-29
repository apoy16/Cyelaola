export type UserRole = 'pramuniaga' | 'admin' | 'manager';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  is_active: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  items_count?: number;
  created_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  payment_terms: string;
  created_at?: string;
}

export interface Item {
  id: number;
  barcode: string;
  name: string;
  category_id: number | null;
  category_name?: string;
  supplier_id: number | null;
  supplier_name?: string;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  wholesale_min_qty: number;
  unit_retail: string;
  unit_wholesale: string;
  pieces_per_wholesale: number;
  stock_pcs: number;
  stock_wholesale?: number;
  min_stock_alert: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

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
  // Transaction Line specifics
  pricing_type: 'retail' | 'wholesale';
  unit_name: string;
  quantity: number;
  multiplier_to_pcs: number;
  unit_price: number;
  subtotal: number;
}

export interface TransactionDetail {
  id: number;
  transaction_id: number;
  item_id: number;
  barcode: string;
  item_name: string;
  pricing_type: 'retail' | 'wholesale';
  unit_name: string;
  quantity: number;
  multiplier_to_pcs: number;
  total_pcs: number;
  cost_price: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
}

export interface Transaction {
  id: number;
  invoice_no: string;
  cashier_name: string;
  customer_name: string;
  customer_phone?: string;
  total_items_count: number;
  subtotal: number;
  discount: number;
  grand_total: number;
  payment_method: 'cash' | 'qris' | 'transfer' | 'tempo';
  amount_paid: number;
  change_due: number;
  status: 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  details?: TransactionDetail[];
}

export interface StoreSettings {
  id: number;
  store_name: string;
  address: string;
  city: string;
  phone: string;
  receipt_footer: string;
  paper_size: '58mm' | '80mm';
  auto_print: number;
}

export interface DashboardStats {
  today_omzet: number;
  today_transactions: number;
  today_items_sold: number;
  total_products: number;
  low_stock_count: number;
  top_items: Array<{
    item_name: string;
    total_qty: number;
    unit_name: string;
    total_sales: number;
  }>;
}
