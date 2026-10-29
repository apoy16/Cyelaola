import { Item, Category, Supplier, Transaction, StoreSettings, DashboardStats, User, UserRole } from '../types';

let currentUserRole: UserRole = 'manager';

export function setCurrentUserRole(role: UserRole) {
  currentUserRole = role;
}

export const api = {
  // Auth & Users
  async login(username: string, password: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    currentUserRole = json.data.role;
    return json.data;
  },
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users', {
      headers: { 'x-user-role': currentUserRole },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async createUser(data: { username: string; password: string; name: string; role: UserRole }): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentUserRole },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async deleteUser(id: number): Promise<void> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentUserRole },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },
  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async deleteCategory(id: number): Promise<void> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const res = await fetch('/api/suppliers');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier> {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async deleteSupplier(id: number): Promise<void> {
    const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  // Items
  async getItems(params?: { search?: string; category_id?: string | number; low_stock?: boolean }): Promise<Item[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category_id) query.append('category_id', String(params.category_id));
    if (params?.low_stock) query.append('low_stock', 'true');
    const res = await fetch(`/api/items?${query.toString()}`, {
      headers: { 'x-user-role': currentUserRole },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async getItemByBarcode(barcode: string): Promise<Item> {
    const res = await fetch(`/api/items/barcode/${encodeURIComponent(barcode)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async createItem(data: Partial<Item>): Promise<Item> {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async updateItem(id: number, data: Partial<Item>): Promise<Item> {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async deleteItem(id: number): Promise<void> {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },
  async adjustStock(id: number, adjustment_type: 'add' | 'subtract' | 'set', quantity: number, unit_type: 'retail' | 'wholesale'): Promise<Item> {
    const res = await fetch(`/api/items/${id}/adjust-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustment_type, quantity, unit_type }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  // Transactions
  async getTransactions(params?: { search?: string; start_date?: string; end_date?: string }): Promise<Transaction[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const res = await fetch(`/api/transactions?${query.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async getTransactionDetail(id: number | string): Promise<Transaction> {
    const res = await fetch(`/api/transactions/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async createTransaction(payload: any): Promise<any> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async cancelTransaction(id: number): Promise<void> {
    const res = await fetch(`/api/transactions/${id}/cancel`, {
      method: 'POST',
      headers: { 'x-user-role': currentUserRole },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  // Settings
  async getSettings(): Promise<StoreSettings> {
    const res = await fetch('/api/settings');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
  async updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
};
