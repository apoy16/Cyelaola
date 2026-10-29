import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'grosir_pos.db');
export const db = new Database(dbPath);

// Enable WAL mode & foreign keys for speed and reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      address TEXT,
      payment_terms TEXT DEFAULT 'COD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      cost_price REAL NOT NULL,
      retail_price REAL NOT NULL,
      wholesale_price REAL NOT NULL,
      wholesale_min_qty INTEGER NOT NULL DEFAULT 1,
      unit_retail TEXT NOT NULL DEFAULT 'Pcs',
      unit_wholesale TEXT NOT NULL DEFAULT 'Dus',
      pieces_per_wholesale INTEGER NOT NULL DEFAULT 24,
      stock_pcs INTEGER NOT NULL DEFAULT 0,
      min_stock_alert INTEGER NOT NULL DEFAULT 24,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT NOT NULL UNIQUE,
      cashier_name TEXT NOT NULL DEFAULT 'Kasir Utama',
      customer_name TEXT DEFAULT 'Pelanggan Umum',
      customer_phone TEXT,
      total_items_count INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      amount_paid REAL NOT NULL,
      change_due REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id),
      barcode TEXT NOT NULL,
      item_name TEXT NOT NULL,
      pricing_type TEXT NOT NULL,
      unit_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      multiplier_to_pcs INTEGER NOT NULL DEFAULT 1,
      total_pcs INTEGER NOT NULL,
      cost_price REAL NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      store_name TEXT NOT NULL DEFAULT 'GROSIR MAKMUR JAYA',
      address TEXT NOT NULL DEFAULT 'Pasar Induk Kramat Jati Blok B-12',
      city TEXT NOT NULL DEFAULT 'Jakarta Timur',
      phone TEXT NOT NULL DEFAULT '0812-9876-5432',
      receipt_footer TEXT NOT NULL DEFAULT 'Barang yang dibeli tidak dapat ditukar/dikembalikan.\nSimpan struk ini sebagai bukti pembayaran sah.\nTerima Kasih atas Kunjungan Anda!',
      paper_size TEXT NOT NULL DEFAULT '58mm',
      auto_print INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('pramuniaga', 'admin', 'manager')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initialize seed users if empty
  const hasUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (hasUsers.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
    insertUser.run('owner', 'owner123', 'H. Sudirman (Manager/Owner)', 'manager');
    insertUser.run('admin', 'admin123', 'Dewi Lestari (Admin Gudang & Toko)', 'admin');
    insertUser.run('kasir1', 'kasir123', 'Rian Pratama (Pramuniaga Shift 1)', 'pramuniaga');
    insertUser.run('kasir2', 'kasir123', 'Siti Rahma (Pramuniaga Shift 2)', 'pramuniaga');
  }

  // Initialize store settings default row
  const hasSettings = db.prepare('SELECT COUNT(*) as count FROM store_settings').get() as { count: number };
  if (hasSettings.count === 0) {
    db.prepare(`
      INSERT INTO store_settings (id, store_name, address, city, phone, receipt_footer, paper_size, auto_print)
      VALUES (1, 'GROSIR MAKMUR JAYA', 'Pasar Induk Kramat Jati Blok B-12', 'Jakarta Timur', '0812-9876-5432', 'Barang yang dibeli tidak dapat ditukar/dikembalikan.\nSimpan struk ini sebagai bukti pembayaran sah.\nTerima Kasih atas Kunjungan Anda!', '58mm', 1)
    `).run();
  }

  // Seed data if categories are empty
  const hasCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (hasCategories.count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  const catMie = insertCategory.run('Mie & Makanan Instan', 'Mie instan, bihun, soun, makanan kaleng').lastInsertRowid;
  const catMinyak = insertCategory.run('Minyak Goreng & Margarin', 'Minyak kelapa sawit pouch & jerigen, margarin').lastInsertRowid;
  const catBeras = insertCategory.run('Beras & Gula', 'Beras karungan, gula pasir, tepung terigu').lastInsertRowid;
  const catMinuman = insertCategory.run('Minuman & Kopi', 'Kopi sachet, teh celup, susu kental manis, minuman kemasan').lastInsertRowid;
  const catSabun = insertCategory.run('Sabun & Deterjen', 'Sabun mandi, deterjen bubuk/cair, pencuci piring').lastInsertRowid;
  const catBumbu = insertCategory.run('Bumbu & Sembako', 'Kecap, saus, penyedap rasa, garam dapur').lastInsertRowid;

  const insertSupplier = db.prepare('INSERT INTO suppliers (name, contact_person, phone, address, payment_terms) VALUES (?, ?, ?, ?, ?)');
  const supIndofood = insertSupplier.run('PT Indofood CBP Sukses Makmur', 'Bpk. Hendra Saputra', '0813-1122-3344', 'Kawasan Industri Pulogadung, Jakarta', 'Tempo 30 Hari').lastInsertRowid;
  const supWings = insertSupplier.run('PT Wings Surya Distributor', 'Ibu Ratna Dewi', '0812-4455-6677', 'Jl. Tipar Cakung No. 45, Jakarta', 'Tempo 14 Hari').lastInsertRowid;
  const supMayora = insertSupplier.run('PT Mayora Indah Tbk', 'Bpk. Agus Salim', '0815-9988-7766', 'Jl. Daan Mogot Km 18, Tangerang', 'COD (Tunai)').lastInsertRowid;
  const supBulog = insertSupplier.run('Perum BULOG & Distributor Beras', 'Bpk. Bambang Sutrisno', '0821-3322-1100', 'Jl. Gatot Subroto No. 49, Jakarta', 'Transfer Bank').lastInsertRowid;

  const insertItem = db.prepare(`
    INSERT INTO items (
      barcode, name, category_id, supplier_id,
      cost_price, retail_price, wholesale_price, wholesale_min_qty,
      unit_retail, unit_wholesale, pieces_per_wholesale,
      stock_pcs, min_stock_alert
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialItems = [
    {
      barcode: '8998866200224',
      name: 'Indomie Goreng Spesial 85g',
      cat: catMie,
      sup: supIndofood,
      cost: 118000, // per dus
      retail: 3500, // per bks
      wholesale: 128000, // per dus (40 bks = @3200)
      wholesale_min_qty: 1,
      unit_retail: 'Bks',
      unit_wholesale: 'Dus',
      pieces_per_wholesale: 40,
      stock: 480, // 12 dus
      min_stock: 80,
    },
    {
      barcode: '8998866200552',
      name: 'Indomie Ayam Bawang 69g',
      cat: catMie,
      sup: supIndofood,
      cost: 114000,
      retail: 3400,
      wholesale: 124000,
      wholesale_min_qty: 1,
      unit_retail: 'Bks',
      unit_wholesale: 'Dus',
      pieces_per_wholesale: 40,
      stock: 360, // 9 dus
      min_stock: 80,
    },
    {
      barcode: '8991002101234',
      name: 'Minyak Goreng Minyakita 1 Liter Pouch',
      cat: catMinyak,
      sup: supBulog,
      cost: 170000, // per dus (12 pcs)
      retail: 16000,
      wholesale: 182000, // per dus (@15166)
      wholesale_min_qty: 1,
      unit_retail: 'Pouch',
      unit_wholesale: 'Dus',
      pieces_per_wholesale: 12,
      stock: 180, // 15 dus
      min_stock: 36,
    },
    {
      barcode: '8991002105678',
      name: 'Minyak Goreng Bimoli Klasik 2 Liter Pouch',
      cat: catMinyak,
      sup: supIndofood,
      cost: 215000, // per dus (6 pouch)
      retail: 39500,
      wholesale: 230000, // per dus (@38333)
      wholesale_min_qty: 1,
      unit_retail: 'Pouch',
      unit_wholesale: 'Dus',
      pieces_per_wholesale: 6,
      stock: 60, // 10 dus
      min_stock: 18,
    },
    {
      barcode: '8993175537554',
      name: 'Kopi Kapal Api Spesial Mix 24g (Renceng)',
      cat: catMinuman,
      sup: supMayora,
      cost: 135000, // per karton (12 renceng x 10 sachet = 120 sachet)
      retail: 1500, // per sachet
      wholesale: 148000, // per karton (12 renceng)
      wholesale_min_qty: 1,
      unit_retail: 'Sachet',
      unit_wholesale: 'Karton',
      pieces_per_wholesale: 120,
      stock: 600, // 5 karton
      min_stock: 120,
    },
    {
      barcode: '8992775211100',
      name: 'Gula Pasir Gulaku Premium Putih 1 Kg',
      cat: catBeras,
      sup: supBulog,
      cost: 390000, // per dus (24 kg)
      retail: 18000,
      wholesale: 415000, // per dus (24 kg = @17291)
      wholesale_min_qty: 1,
      unit_retail: 'Kg',
      unit_wholesale: 'Dus',
      pieces_per_wholesale: 24,
      stock: 120, // 5 dus
      min_stock: 24,
    },
    {
      barcode: '8992775334455',
      name: 'Beras Setra Ramos Super 25 Kg',
      cat: catBeras,
      sup: supBulog,
      cost: 330000,
      retail: 360000,
      wholesale: 345000,
      wholesale_min_qty: 5,
      unit_retail: 'Karung',
      unit_wholesale: 'Bal/5Karung',
      pieces_per_wholesale: 5,
      stock: 35,
      min_stock: 10,
    },
    {
      barcode: '8999999052011',
      name: 'Sunlight Jeruk Nipis Pencuci Piring 650ml',
      cat: catSabun,
      sup: supWings,
      cost: 162000, // per dus (12 pouch)
      retail: 16000,
      wholesale: 175000, // per dus (@14583)
      wholesale_min_qty: 1,
      unit_retail: 'Pouch',
      unit_wholesale: 'Dus',
      pieces_per_wholesale: 12,
      stock: 72, // 6 dus
      min_stock: 24,
    },
    {
      barcode: '8998899120011',
      name: 'Deterjen Daia Putih 850g',
      cat: catSabun,
      sup: supWings,
      cost: 195000, // per dus (12 bks)
      retail: 19500,
      wholesale: 212000, // per dus (@17666)
      wholesale_min_qty: 1,
      unit_retail: 'Bks',
      unit_wholesale: 'Dus',
      pieces_per_wholesale: 12,
      stock: 84, // 7 dus
      min_stock: 24,
    },
    {
      barcode: '8991001700201',
      name: 'Kecap Bango Manis Refill 520ml',
      cat: catBumbu,
      sup: supIndofood,
      cost: 250000, // per dus (12 pouch)
      retail: 24500,
      wholesale: 270000, // per dus (@22500)
      wholesale_min_qty: 1,
      unit_retail: 'Pouch',
      unit_wholesale: 'Dus',
      pieces_per_wholesale: 12,
      stock: 48, // 4 dus
      min_stock: 12,
    },
    {
      barcode: '8992761001020',
      name: 'Susu Kental Manis Frisian Flag Cokelat 370g',
      cat: catMinuman,
      sup: supMayora,
      cost: 510000, // per karton (48 kaleng)
      retail: 12500,
      wholesale: 545000, // per karton (@11354)
      wholesale_min_qty: 1,
      unit_retail: 'Kaleng',
      unit_wholesale: 'Karton',
      pieces_per_wholesale: 48,
      stock: 96, // 2 karton
      min_stock: 48,
    },
    {
      barcode: '8998866100101',
      name: 'Pop Mie Rasa Ayam Bawang 75g',
      cat: catMie,
      sup: supIndofood,
      cost: 110000, // per karton (24 cup)
      retail: 5500,
      wholesale: 120000, // per karton (@5000)
      wholesale_min_qty: 1,
      unit_retail: 'Cup',
      unit_wholesale: 'Karton',
      pieces_per_wholesale: 24,
      stock: 120, // 5 karton
      min_stock: 24,
    }
  ];

  for (const item of initialItems) {
    insertItem.run(
      item.barcode,
      item.name,
      item.cat,
      item.sup,
      item.cost,
      item.retail,
      item.wholesale,
      item.wholesale_min_qty,
      item.unit_retail,
      item.unit_wholesale,
      item.pieces_per_wholesale,
      item.stock,
      item.min_stock
    );
  }

  // Also seed a couple of realistic demo transactions for reporting
  const insertTx = db.prepare(`
    INSERT INTO transactions (
      invoice_no, cashier_name, customer_name, customer_phone,
      total_items_count, subtotal, discount, grand_total,
      payment_method, amount_paid, change_due, status, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now', '-2 hours'))
  `);

  const insertDetail = db.prepare(`
    INSERT INTO transaction_details (
      transaction_id, item_id, barcode, item_name,
      pricing_type, unit_name, quantity, multiplier_to_pcs,
      total_pcs, cost_price, unit_price, subtotal
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Tx 1: Grosir Toko Kelontong Berkah
  const tx1Id = insertTx.run(
    'INV-20261029-0001',
    'Kasir Grosir 1',
    'Toko Kelontong Berkah',
    '0813-8877-6655',
    3,
    438000,
    8000,
    430000,
    'cash',
    450000,
    20000,
    'Langganan warung binaan'
  ).lastInsertRowid;

  insertDetail.run(tx1Id, 1, '8998866200224', 'Indomie Goreng Spesial 85g', 'wholesale', 'Dus', 2, 40, 80, 118000, 128000, 256000);
  insertDetail.run(tx1Id, 3, '8991002101234', 'Minyak Goreng Minyakita 1 Liter Pouch', 'wholesale', 'Dus', 1, 12, 12, 170000, 182000, 182000);

  // Tx 2: Eceran Pelanggan Umum
  const tx2Id = insertTx.run(
    'INV-20261029-0002',
    'Kasir Grosir 1',
    'Bpk. Suprianto',
    '0852-1100-2299',
    6,
    51500,
    0,
    51500,
    'qris',
    51500,
    0,
    'Bayar QRIS Toko'
  ).lastInsertRowid;

  insertDetail.run(tx2Id, 1, '8998866200224', 'Indomie Goreng Spesial 85g', 'retail', 'Bks', 5, 1, 5, 2950, 3500, 17500);
  insertDetail.run(tx2Id, 8, '8999999052011', 'Sunlight Jeruk Nipis Pencuci Piring 650ml', 'retail', 'Pouch', 1, 1, 1, 13500, 16000, 16000);
  insertDetail.run(tx2Id, 6, '8992775211100', 'Gula Pasir Gulaku Premium Putih 1 Kg', 'retail', 'Kg', 1, 1, 1, 16250, 18000, 18000);
}
