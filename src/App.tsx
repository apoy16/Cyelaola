import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Boxes,
  Layers,
  Receipt,
  Settings as SettingsIcon,
  Server,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Printer,
  User as UserIcon,
  Users,
  LogOut,
  Shield,
  KeyRound,
} from 'lucide-react';
import { Item, Category, Supplier, StoreSettings, DashboardStats, User } from './types';
import { api, setCurrentUserRole } from './services/api';
import { formatRupiah } from './utils/pos-calculations';
import { getRolePermissions, getRoleBadgeLabel } from './utils/auth-permissions';
import { CashierTab } from './components/CashierTab';
import { InventoryTab } from './components/InventoryTab';
import { CategoriesSuppliersTab } from './components/CategoriesSuppliersTab';
import { TransactionsTab } from './components/TransactionsTab';
import { SettingsTab } from './components/SettingsTab';
import { ArchitectureTab } from './components/ArchitectureTab';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';

export default function App() {
  // Current user state (defaults to owner for instant demo, easily switchable via LoginModal)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 1,
    username: 'owner',
    name: 'H. Sudirman (Manager/Owner)',
    role: 'manager',
    is_active: 1,
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);

  const permissions = getRolePermissions(currentUser.role);

  const [activeTab, setActiveTab] = useState<'cashier' | 'inventory' | 'categories' | 'transactions' | 'settings' | 'architecture'>('cashier');

  // Master Data State
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    id: 1,
    store_name: 'GROSIR MAKMUR JAYA',
    address: 'Pasar Induk Kramat Jati Blok B-12',
    city: 'Jakarta Timur',
    phone: '0812-9876-5432',
    receipt_footer: 'Barang yang dibeli tidak dapat ditukar/dikembalikan.\nSimpan struk ini sebagai bukti pembayaran sah.\nTerima Kasih atas Kunjungan Anda!',
    paper_size: '58mm',
    auto_print: 1,
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [itemsData, categoriesData, suppliersData, settingsData, statsData] = await Promise.all([
        api.getItems(),
        api.getCategories(),
        api.getSuppliers(),
        api.getSettings(),
        api.getStats(),
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setSettings(settingsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading initial POS data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUserRole(currentUser.role);
    loadData();
  }, [currentUser]);

  // Adjust active tab if current role has no permission
  useEffect(() => {
    if (!permissions.canManageCategoriesAndSuppliers && activeTab === 'categories') {
      setActiveTab('cashier');
    }
    if (!permissions.canManageSettings && activeTab === 'settings') {
      setActiveTab('cashier');
    }
  }, [currentUser, activeTab, permissions]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('cashier');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F3' && permissions.canManageCategoriesAndSuppliers) {
        e.preventDefault();
        setActiveTab('categories');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('transactions');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [permissions]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* TOP HEADER */}
      <header className="bg-black border-b border-zinc-800 shrink-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-black font-mono font-extrabold px-2.5 py-1 text-sm tracking-wider flex items-center gap-1.5 rounded-none">
            <ShoppingCart className="w-4 h-4" />
            <span>POS GROSIR</span>
          </div>
          <div>
            <h1 className="font-mono font-bold text-sm tracking-wide text-white uppercase">
              {settings.store_name}
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono">
              Sistem Kasir Toko Grosir Modern • Multi-Role RBAC • SQLite
            </p>
          </div>
        </div>

        {/* Real-time Stats Chips (HIDDEN for Pramuniaga, Visible for Admin & Manager) */}
        {stats && permissions.canViewFinancialOmzet && (
          <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-zinc-400 text-[11px]">Omzet Hari Ini:</span>
              <span className="font-bold text-emerald-400">{formatRupiah(stats.today_omzet)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1">
              <Receipt className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-zinc-400 text-[11px]">Transaksi:</span>
              <span className="font-bold text-sky-400">{stats.today_transactions} Nota</span>
            </div>

            {stats.low_stock_count > 0 && (
              <div
                onClick={() => setActiveTab('inventory')}
                className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-700/80 px-2.5 py-1 cursor-pointer hover:bg-amber-900/60 transition-colors"
                title="Klik untuk melihat barang stok menipis"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 text-[11px]">Stok Kritis:</span>
                <span className="font-bold text-amber-400">{stats.low_stock_count} Produk</span>
              </div>
            )}
          </div>
        )}

        {/* USER PROFILE & ROLE BADGE + SWITCH BUTTON */}
        <div className="flex items-center gap-2">
          {/* Active User Card */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2.5 py-1 font-mono text-xs">
            <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
            <div className="text-left">
              <div className="text-[11px] font-bold text-white truncate max-w-[130px]">
                {currentUser.name}
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[9px] px-1 py-0.2 font-bold uppercase tracking-wider ${
                    currentUser.role === 'manager'
                      ? 'bg-amber-950 text-amber-400 border border-amber-700'
                      : currentUser.role === 'admin'
                      ? 'bg-sky-950 text-sky-400 border border-sky-700'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  }`}
                >
                  {getRoleBadgeLabel(currentUser.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Switch User / Login Button */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-2.5 py-1.5 font-mono text-xs flex items-center gap-1.5 cursor-pointer rounded-none"
            title="Ganti Pengguna / Login Akun Lain"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ganti Akun</span>
          </button>

          {/* Manager User Management Button */}
          {permissions.canManageUsers && (
            <button
              onClick={() => setIsUserMgmtOpen(true)}
              className="bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 px-2.5 py-1.5 font-mono text-xs flex items-center gap-1.5 cursor-pointer rounded-none"
              title="Kelola Data Karyawan (Pramuniaga, Admin, Manager)"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Karyawan</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            title="Refresh Data POS"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* NAVIGATION TABS (WITH ROLE RESTRICTION) */}
      <nav className="bg-zinc-900 border-b border-zinc-800 shrink-0 px-4 flex gap-1 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('cashier')}
          className={`py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap rounded-none ${
            activeTab === 'cashier'
              ? 'border-emerald-500 bg-black text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>[F1] Kasir POS</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap rounded-none ${
            activeTab === 'inventory'
              ? 'border-emerald-500 bg-black text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>
            [F2] {permissions.canEditInventory ? 'Stok & Katalog' : 'Cek Stok & Harga'}
          </span>
        </button>

        {permissions.canManageCategoriesAndSuppliers && (
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap rounded-none ${
              activeTab === 'categories'
                ? 'border-emerald-500 bg-black text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>[F3] Kategori & Supplier</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap rounded-none ${
            activeTab === 'transactions'
              ? 'border-emerald-500 bg-black text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>[F4] Riwayat Transaksi</span>
        </button>

        {permissions.canManageSettings && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap rounded-none ${
              activeTab === 'settings'
                ? 'border-emerald-500 bg-black text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Pengaturan & Printer</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('architecture')}
          className={`py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap rounded-none ${
            activeTab === 'architecture'
              ? 'border-emerald-500 bg-black text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Skema DB & Arsitektur</span>
        </button>
      </nav>

      {/* MAIN TAB CONTENT */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'cashier' && (
          <CashierTab
            items={items}
            settings={settings}
            currentUser={currentUser}
            onTransactionComplete={loadData}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            items={items}
            categories={categories}
            suppliers={suppliers}
            userRole={currentUser.role}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'categories' && permissions.canManageCategoriesAndSuppliers && (
          <CategoriesSuppliersTab
            categories={categories}
            suppliers={suppliers}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            settings={settings}
            userRole={currentUser.role}
            onRefreshNeeded={loadData}
          />
        )}

        {activeTab === 'settings' && permissions.canManageSettings && (
          <SettingsTab
            settings={settings}
            onUpdate={(updated) => setSettings(updated)}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureTab />}
      </main>

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <LoginModal
          currentUser={currentUser}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginModalOpen(false);
          }}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* USER MANAGEMENT MODAL (MANAGER ONLY) */}
      {isUserMgmtOpen && permissions.canManageUsers && (
        <UserManagementModal
          currentUser={currentUser}
          onClose={() => setIsUserMgmtOpen(false)}
        />
      )}
    </div>
  );
}
