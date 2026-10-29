import React, { useState } from 'react';
import { Database, Code, FolderTree, Printer, Copy, Check, Terminal, Server, Cpu } from 'lucide-react';

export const ArchitectureTab: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sqlSchema = `-- SKEMA DATABASE APLIKASI KASIR TOKO GROSIR MODERN (SQLite / MariaDB)

-- 1. Tabel Kategori Barang
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Pemasok / Supplier
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  payment_terms VARCHAR(50) DEFAULT 'COD',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Master Barang & Stok (Support Harga Eceran & Grosir per Dus)
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  cost_price DECIMAL(15, 2) NOT NULL,           -- Harga Modal Beli
  retail_price DECIMAL(15, 2) NOT NULL,         -- Harga Eceran (per pcs/bks)
  wholesale_price DECIMAL(15, 2) NOT NULL,      -- Harga Grosir (per dus/karton)
  wholesale_min_qty INTEGER NOT NULL DEFAULT 1, -- Min beli untuk harga grosir
  unit_retail VARCHAR(20) NOT NULL DEFAULT 'Pcs',
  unit_wholesale VARCHAR(20) NOT NULL DEFAULT 'Dus',
  pieces_per_wholesale INTEGER NOT NULL DEFAULT 24, -- 1 Dus = X Pcs
  stock_pcs INTEGER NOT NULL DEFAULT 0,         -- Total stok dalam unit pcs
  min_stock_alert INTEGER NOT NULL DEFAULT 24,  -- Peringatan stok kritis
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Header Transaksi Penjualan
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no VARCHAR(50) NOT NULL UNIQUE,       -- Contoh: INV-20261029-0001
  cashier_name VARCHAR(100) NOT NULL,
  customer_name VARCHAR(100) DEFAULT 'Pelanggan Umum',
  customer_phone VARCHAR(50),
  total_items_count INTEGER NOT NULL,
  subtotal DECIMAL(15, 2) NOT NULL,
  discount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,          -- cash | qris | transfer | tempo
  amount_paid DECIMAL(15, 2) NOT NULL,
  change_due DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- completed | cancelled
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Detail Item Transaksi (Snapshot Penjualan)
CREATE TABLE IF NOT EXISTS transaction_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  barcode VARCHAR(50) NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  pricing_type VARCHAR(20) NOT NULL,            -- retail | wholesale
  unit_name VARCHAR(20) NOT NULL,               -- Pcs | Dus
  quantity INTEGER NOT NULL,
  multiplier_to_pcs INTEGER NOT NULL DEFAULT 1, -- Konversi pengurang stok
  total_pcs INTEGER NOT NULL,                   -- quantity * multiplier_to_pcs
  cost_price DECIMAL(15, 2) NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  subtotal DECIMAL(15, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Pengguna & Hak Akses (RBAC: Pramuniaga, Admin, Manager)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('pramuniaga', 'admin', 'manager')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Konfigurasi Toko & Printer Thermal
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  store_name VARCHAR(150) NOT NULL DEFAULT 'GROSIR MAKMUR JAYA',
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(50),
  receipt_footer TEXT,
  paper_size VARCHAR(10) NOT NULL DEFAULT '58mm', -- 58mm | 80mm
  auto_print INTEGER NOT NULL DEFAULT 1
);

-- INDEX OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_no);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_tx_details_tx ON transaction_details(transaction_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`;

  const folderStructure = `toko-grosir-pos/
├── server.ts                       # Entry point Express backend & Vite middleware
├── server/                         # Modul Backend API & Database
│   ├── db.ts                       # SQLite schema, tables DDL, & automatic seed data
│   └── routes.ts                   # REST API routes (Items, Categories, Suppliers, Tx, Settings)
├── grosir_pos.db                   # Database SQLite lokal file (WAL Mode aktif)
├── src/                            # Frontend React TypeScript
│   ├── components/                 # Modul Antarmuka Kasir & Manajemen
│   │   ├── CashierTab.tsx          # Layar Kasir Utama (Auto-focus barcode, grosir toggle, bayar)
│   │   ├── InventoryTab.tsx        # CRUD Barang & Stok (Harga eceran vs grosir per dus, restock)
│   │   ├── CategoriesSuppliersTab.tsx # CRUD Kategori sembako & Pemasok distributor
│   │   ├── TransactionsTab.tsx     # Riwayat transaksi, void/rollback stok, reprint
│   │   ├── ThermalReceipt.tsx      # Komponen cetak struk thermal 58mm & 80mm (@media print)
│   │   ├── CameraBarcodeScanner.tsx# Scanner barcode live camera (html5-qrcode)
│   │   ├── BluetoothPrinterModal.tsx # Integrasi printer thermal Web Bluetooth API
│   │   ├── SettingsTab.tsx         # Profil toko, konfigurasi kertas, & auto-print
│   │   └── ArchitectureTab.tsx     # Dokumentasi arsitektur, skema DB, & panduan printer
│   ├── utils/                      # Pure Logic & Unit Tests
│   │   ├── pos-calculations.ts     # Logika kalkulasi harga, grosir threshold, kembalian, diskon
│   │   └── pos-calculations.test.ts# Fast unit tests (node:test)
│   ├── services/
│   │   └── api.ts                  # Typed client service untuk memanggil REST API backend
│   ├── types.ts                    # TypeScript interfaces & domain models
│   ├── App.tsx                     # Header navigasi tabs, stats dashboard, & alert banner
│   ├── main.tsx                    # React client entry point
│   └── index.css                   # Tailwind CSS 4 & font imports
├── index.html                      # HTML root & Google Fonts (JetBrains Mono & Jakarta Sans)
├── package.json                    # Dependencies & scripts ("dev": "tsx server.ts")
├── tsconfig.json                   # TypeScript config
└── vite.config.ts                  # Vite build config`;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Server className="w-6 h-6 text-emerald-400" />
          <h1 className="font-mono font-bold text-lg uppercase tracking-wider">
            Arsitektur Sistem & Rancangan Database Toko Grosir
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1 font-sans">
          Spesifikasi teknis, rancangan database relasional terindeks, struktur folder modular, serta panduan konfigurasi printer thermal (58mm/80mm & Bluetooth).
        </p>
      </div>

      {/* TECH STACK GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase mb-2">
            <Cpu className="w-4 h-4" />
            <span>1. Backend & Server</span>
          </div>
          <ul className="text-xs text-zinc-300 font-mono space-y-1">
            <li>• <strong>Runtime:</strong> Node.js (v22+) & TypeScript</li>
            <li>• <strong>Framework:</strong> Express.js</li>
            <li>• <strong>Integrasi:</strong> Vite middleware mode</li>
            <li>• <strong>Transaksi:</strong> Atomic SQLite transactions</li>
            <li>• <strong>Inventory Engine:</strong> Real-time automatic deduction & rollback</li>
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-sky-400 font-mono font-bold text-xs uppercase mb-2">
            <Database className="w-4 h-4" />
            <span>2. Database Storage</span>
          </div>
          <ul className="text-xs text-zinc-300 font-mono space-y-1">
            <li>• <strong>Engine:</strong> SQLite 3 via <code>better-sqlite3</code></li>
            <li>• <strong>Mode:</strong> WAL (Write-Ahead Logging)</li>
            <li>• <strong>Integritas:</strong> Foreign Keys ON, On Delete Cascade</li>
            <li>• <strong>Tabel:</strong> items, categories, suppliers, transactions, transaction_details, store_settings</li>
            <li>• <strong>Indexing:</strong> Barcode, Invoice, Date indexed</li>
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase mb-2">
            <Printer className="w-4 h-4" />
            <span>3. Hardware & POS UX</span>
          </div>
          <ul className="text-xs text-zinc-300 font-mono space-y-1">
            <li>• <strong>Input Kasir:</strong> Barcode auto-focus & USB/BT scanner</li>
            <li>• <strong>Kamera:</strong> Live Barcode Scanner (html5-qrcode)</li>
            <li>• <strong>Harga:</strong> Dual pricing (Eceran pcs vs Grosir dus)</li>
            <li>• <strong>Thermal Print:</strong> Direct 58mm & 80mm receipt</li>
            <li>• <strong>Web Bluetooth:</strong> ESC/POS connection ready</li>
          </ul>
        </div>
      </div>

      {/* DATABASE SCHEMA */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2 font-mono font-bold text-sm text-emerald-400 uppercase">
            <Database className="w-4 h-4" />
            <span>Rancangan Skema Database Relasional (SQL DDL)</span>
          </div>
          <button
            onClick={() => copyToClipboard(sqlSchema, 'sql')}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {copiedSection === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'sql' ? 'Tersalin' : 'Copy SQL'}</span>
          </button>
        </div>

        <pre className="bg-black border border-zinc-800 p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-96 leading-relaxed">
          {sqlSchema}
        </pre>
      </div>

      {/* PROJECT FOLDER STRUCTURE */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2 font-mono font-bold text-sm text-sky-400 uppercase">
            <FolderTree className="w-4 h-4" />
            <span>Struktur Folder Proyek yang Modular</span>
          </div>
          <button
            onClick={() => copyToClipboard(folderStructure, 'folder')}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {copiedSection === 'folder' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'folder' ? 'Tersalin' : 'Copy Struktur'}</span>
          </button>
        </div>

        <pre className="bg-black border border-zinc-800 p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-80 leading-relaxed">
          {folderStructure}
        </pre>
      </div>

      {/* THERMAL PRINTER SETUP INSTRUCTIONS */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex items-center gap-2 font-mono font-bold text-sm text-amber-400 uppercase pb-2 border-b border-zinc-800">
          <Printer className="w-4 h-4" />
          <span>Instruksi Menjalankan Aplikasi & Konfigurasi Thermal Printer</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-zinc-300">
          <div className="bg-black p-4 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              1. Cara Menjalankan Aplikasi
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-zinc-400 font-sans">
              <li>
                <strong>Install Dependensi:</strong>
                <pre className="bg-zinc-900 p-1.5 mt-1 text-[11px] text-emerald-300 font-mono">npm install</pre>
              </li>
              <li>
                <strong>Jalankan Development Mode (Express + Vite):</strong>
                <pre className="bg-zinc-900 p-1.5 mt-1 text-[11px] text-emerald-300 font-mono">npm run dev</pre>
                Server akan otomatis jalan di <code>http://localhost:3000</code> dan database SQLite <code>grosir_pos.db</code> otomatis di-generate lengkap dengan data katalog grosir awal.
              </li>
              <li>
                <strong>Build & Production Run:</strong>
                <pre className="bg-zinc-900 p-1.5 mt-1 text-[11px] text-emerald-300 font-mono">npm run build && npm start</pre>
              </li>
              <li>
                <strong>Jalankan Unit Test Logika Kasir:</strong>
                <pre className="bg-zinc-900 p-1.5 mt-1 text-[11px] text-emerald-300 font-mono">npx tsx --test src/utils/pos-calculations.test.ts</pre>
              </li>
            </ol>
          </div>

          <div className="bg-black p-4 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-sky-400" />
              2. Konfigurasi Printer Thermal (58mm / 80mm)
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-zinc-400 font-sans">
              <li>
                <strong>Koneksi Hardware:</strong> Hubungkan printer thermal via kabel USB ke PC kasir atau nyalakan Bluetooth jika memakai printer mobile.
              </li>
              <li>
                <strong>Pilih Ukuran Kertas di Pengaturan:</strong> Buka tab <em>"Pengaturan & Printer"</em>, pilih <strong>58mm</strong> (lebar struk 54mm) atau <strong>80mm</strong> (lebar struk 76mm).
              </li>
              <li>
                <strong>Auto-Print Trigger:</strong> Centang opsi <em>"Aktifkan Auto-Print"</em>. Setiap kali tombol bayar ditekan, dialog cetak langsung terbuka otomatis via <code>window.print()</code>.
              </li>
              <li>
                <strong>Cetak Otomatis Tanpa Dialog (Chrome Kiosk Mode):</strong>
                Buka terminal/shortcut Chrome dengan flag:
                <pre className="bg-zinc-900 p-1.5 mt-1 text-[11px] text-sky-300 font-mono">chrome.exe --kiosk-printing http://localhost:3000</pre>
                Dengan mode ini, printer thermal langsung mengeluarkan kertas nota tanpa ada dialog konfirmasi popup!
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
