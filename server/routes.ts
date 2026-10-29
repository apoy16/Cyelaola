import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { generateInvoiceNumber } from '../src/utils/pos-calculations.js';

export const apiRouter = Router();

// ==========================================
// AUTHENTICATION & USERS
// ==========================================
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    const user = db.prepare('SELECT id, username, name, role, is_active FROM users WHERE username = ? AND password = ?').get(
      username.trim(),
      password
    ) as any;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan oleh Manager' });
    }

    res.json({ success: true, data: user, message: `Login berhasil sebagai ${user.role}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.get('/users', (req: Request, res: Response) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, is_active, created_at FROM users ORDER BY id ASC').all();
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/users', (req: Request, res: Response) => {
  try {
    const roleHeader = req.headers['x-user-role'];
    if (roleHeader !== 'manager') {
      return res.status(403).json({ success: false, message: 'Hanya Manager/Owner yang dapat menambah pengguna' });
    }

    const { username, password, name, role } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi' });
    }

    const stmt = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username.trim().toLowerCase(), password, name.trim(), role);
    const created = db.prepare('SELECT id, username, name, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message.includes('UNIQUE') ? 'Username sudah digunakan' : err.message
    });
  }
});

apiRouter.delete('/users/:id', (req: Request, res: Response) => {
  try {
    const roleHeader = req.headers['x-user-role'];
    if (roleHeader !== 'manager') {
      return res.status(403).json({ success: false, message: 'Hanya Manager/Owner yang dapat menghapus pengguna' });
    }

    const { id } = req.params;
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// CATEGORIES
// ==========================================
apiRouter.get('/categories', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT c.*, COUNT(i.id) as items_count 
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id AND i.is_active = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/categories', (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }
    const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    const result = stmt.run(name.trim(), description || '');
    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newCategory });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message.includes('UNIQUE') ? 'Nama kategori sudah ada' : err.message });
  }
});

apiRouter.put('/categories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }
    db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name.trim(), description || '', id);
    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

apiRouter.delete('/categories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// SUPPLIERS
// ==========================================
apiRouter.get('/suppliers', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/suppliers', (req: Request, res: Response) => {
  try {
    const { name, contact_person, phone, address, payment_terms } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama supplier wajib diisi' });
    }
    const stmt = db.prepare(`
      INSERT INTO suppliers (name, contact_person, phone, address, payment_terms)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name.trim(), contact_person || '', phone || '', address || '', payment_terms || 'COD');
    const newSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newSupplier });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

apiRouter.put('/suppliers/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, address, payment_terms } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama supplier wajib diisi' });
    }
    db.prepare(`
      UPDATE suppliers
      SET name = ?, contact_person = ?, phone = ?, address = ?, payment_terms = ?
      WHERE id = ?
    `).run(name.trim(), contact_person || '', phone || '', address || '', payment_terms || 'COD', id);
    const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

apiRouter.delete('/suppliers/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    res.json({ success: true, message: 'Supplier berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// ITEMS & INVENTORY
// ==========================================
apiRouter.get('/items', (req: Request, res: Response) => {
  try {
    const { search, category_id, low_stock } = req.query;
    let query = `
      SELECT i.*, 
        c.name as category_name,
        s.name as supplier_name,
        ROUND(i.stock_pcs / CAST(i.pieces_per_wholesale AS REAL), 1) as stock_wholesale
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.is_active = 1
    `;
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (i.name LIKE ? OR i.barcode LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category_id && category_id !== 'all') {
      query += ` AND i.category_id = ?`;
      params.push(category_id);
    }

    if (low_stock === 'true') {
      query += ` AND i.stock_pcs <= i.min_stock_alert`;
    }

    query += ` ORDER BY i.name ASC`;
    const rows = db.prepare(query).all(...params) as any[];

    // Mask cost_price if requester is Pramuniaga
    const userRole = req.headers['x-user-role'];
    if (userRole === 'pramuniaga') {
      for (const row of rows) {
        row.cost_price = 0; // Pramuniaga cannot see purchase modal
      }
    }

    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.get('/items/barcode/:barcode', (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const item = db.prepare(`
      SELECT i.*, 
        c.name as category_name,
        s.name as supplier_name,
        ROUND(i.stock_pcs / CAST(i.pieces_per_wholesale AS REAL), 1) as stock_wholesale
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE (i.barcode = ? OR i.barcode = ?) AND i.is_active = 1
    `).get(barcode.trim(), barcode.trim().toUpperCase());

    if (!item) {
      return res.status(404).json({ success: false, message: 'Barang dengan barcode ini tidak ditemukan' });
    }
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.get('/items/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = db.prepare(`
      SELECT i.*, 
        c.name as category_name,
        s.name as supplier_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = ?
    `).get(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/items', (req: Request, res: Response) => {
  try {
    const {
      barcode, name, category_id, supplier_id,
      cost_price, retail_price, wholesale_price, wholesale_min_qty,
      unit_retail, unit_wholesale, pieces_per_wholesale,
      stock_pcs, min_stock_alert
    } = req.body;

    if (!barcode || !name) {
      return res.status(400).json({ success: false, message: 'Barcode dan Nama Barang wajib diisi' });
    }

    const stmt = db.prepare(`
      INSERT INTO items (
        barcode, name, category_id, supplier_id,
        cost_price, retail_price, wholesale_price, wholesale_min_qty,
        unit_retail, unit_wholesale, pieces_per_wholesale,
        stock_pcs, min_stock_alert
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      barcode.trim(),
      name.trim(),
      category_id || null,
      supplier_id || null,
      Number(cost_price) || 0,
      Number(retail_price) || 0,
      Number(wholesale_price) || 0,
      Number(wholesale_min_qty) || 1,
      unit_retail || 'Pcs',
      unit_wholesale || 'Dus',
      Number(pieces_per_wholesale) || 1,
      Number(stock_pcs) || 0,
      Number(min_stock_alert) || 10
    );

    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message.includes('UNIQUE') ? 'Barcode ini sudah terdaftar pada barang lain' : err.message
    });
  }
});

apiRouter.put('/items/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      barcode, name, category_id, supplier_id,
      cost_price, retail_price, wholesale_price, wholesale_min_qty,
      unit_retail, unit_wholesale, pieces_per_wholesale,
      stock_pcs, min_stock_alert
    } = req.body;

    if (!barcode || !name) {
      return res.status(400).json({ success: false, message: 'Barcode dan Nama Barang wajib diisi' });
    }

    db.prepare(`
      UPDATE items SET
        barcode = ?,
        name = ?,
        category_id = ?,
        supplier_id = ?,
        cost_price = ?,
        retail_price = ?,
        wholesale_price = ?,
        wholesale_min_qty = ?,
        unit_retail = ?,
        unit_wholesale = ?,
        pieces_per_wholesale = ?,
        stock_pcs = ?,
        min_stock_alert = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      barcode.trim(),
      name.trim(),
      category_id || null,
      supplier_id || null,
      Number(cost_price) || 0,
      Number(retail_price) || 0,
      Number(wholesale_price) || 0,
      Number(wholesale_min_qty) || 1,
      unit_retail || 'Pcs',
      unit_wholesale || 'Dus',
      Number(pieces_per_wholesale) || 1,
      Number(stock_pcs) || 0,
      Number(min_stock_alert) || 10,
      id
    );

    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message.includes('UNIQUE') ? 'Barcode ini sudah dipakai oleh barang lain' : err.message
    });
  }
});

apiRouter.delete('/items/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Soft delete or hard delete
    db.prepare('UPDATE items SET is_active = 0 WHERE id = ?').run(id);
    res.json({ success: true, message: 'Barang berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/items/:id/adjust-stock', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adjustment_type, quantity, unit_type } = req.body; // type: 'add' | 'subtract' | 'set'

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as any;
    if (!item) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }

    const multiplier = unit_type === 'wholesale' ? item.pieces_per_wholesale : 1;
    const deltaPcs = Math.round(Number(quantity) * multiplier);

    let newStock = item.stock_pcs;
    if (adjustment_type === 'add') {
      newStock += deltaPcs;
    } else if (adjustment_type === 'subtract') {
      newStock = Math.max(0, newStock - deltaPcs);
    } else if (adjustment_type === 'set') {
      newStock = Math.max(0, deltaPcs);
    }

    db.prepare('UPDATE items SET stock_pcs = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, id);
    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json({ success: true, data: updated, message: `Stok berhasil diupdate menjadi ${newStock} ${item.unit_retail}` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// TRANSACTIONS & CHECKOUT (TRANSACTIONAL)
// ==========================================
apiRouter.get('/transactions', (req: Request, res: Response) => {
  try {
    const { search, start_date, end_date, limit = 50 } = req.query;
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      query += ' AND (invoice_no LIKE ? OR customer_name LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (start_date && typeof start_date === 'string') {
      query += ' AND date(created_at) >= date(?)';
      params.push(start_date);
    }

    if (end_date && typeof end_date === 'string') {
      query += ' AND date(created_at) <= date(?)';
      params.push(end_date);
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(Number(limit));

    const transactions = db.prepare(query).all(...params);
    res.json({ success: true, data: transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.get('/transactions/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ? OR invoice_no = ?').get(id, id) as any;
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    const details = db.prepare('SELECT * FROM transaction_details WHERE transaction_id = ?').all(tx.id);
    res.json({ success: true, data: { ...tx, details } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/transactions', (req: Request, res: Response) => {
  try {
    const {
      cashier_name = 'Kasir Utama',
      customer_name = 'Pelanggan Umum',
      customer_phone = '',
      items, // array of { id, barcode, name, pricing_type, unit_name, quantity, multiplier_to_pcs, cost_price, unit_price, subtotal }
      discount = 0,
      payment_method = 'cash',
      amount_paid = 0,
      notes = '',
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Daftar item belanja tidak boleh kosong' });
    }

    // Execute atomic SQLite transaction
    const processCheckout = db.transaction(() => {
      // 1. Generate sequential invoice number
      const countToday = db.prepare(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE date(created_at) = date('now')
      `).get() as { count: number };
      const invoiceNo = generateInvoiceNumber(countToday.count + 1);

      // 2. Validate and calculate totals
      let subtotal = 0;
      let totalItemsCount = 0;

      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unit_price) || 0;
        subtotal += qty * price;
        totalItemsCount += qty;
      }

      const validDiscount = Math.max(0, Math.min(Number(discount) || 0, subtotal));
      const grandTotal = Math.max(0, subtotal - validDiscount);
      const paid = Number(amount_paid) || 0;
      const changeDue = Math.max(0, paid - grandTotal);

      // 3. Deduct stock and insert details
      const updateStockStmt = db.prepare('UPDATE items SET stock_pcs = stock_pcs - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const insertDetailStmt = db.prepare(`
        INSERT INTO transaction_details (
          transaction_id, item_id, barcode, item_name,
          pricing_type, unit_name, quantity, multiplier_to_pcs,
          total_pcs, cost_price, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 4. Insert transaction header
      const insertTxStmt = db.prepare(`
        INSERT INTO transactions (
          invoice_no, cashier_name, customer_name, customer_phone,
          total_items_count, subtotal, discount, grand_total,
          payment_method, amount_paid, change_due, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
      `);

      const txResult = insertTxStmt.run(
        invoiceNo,
        cashier_name.trim(),
        customer_name.trim(),
        customer_phone ? customer_phone.trim() : '',
        totalItemsCount,
        subtotal,
        validDiscount,
        grandTotal,
        payment_method,
        paid,
        changeDue,
        notes || ''
      );

      const transactionId = txResult.lastInsertRowid;

      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        const multiplier = Number(item.multiplier_to_pcs) || 1;
        const totalPcs = qty * multiplier;
        const lineSubtotal = qty * (Number(item.unit_price) || 0);

        // Deduct inventory
        updateStockStmt.run(totalPcs, item.id);

        // Record line item detail
        insertDetailStmt.run(
          transactionId,
          item.id,
          item.barcode,
          item.name,
          item.pricing_type || 'retail',
          item.unit_name || 'Pcs',
          qty,
          multiplier,
          totalPcs,
          Number(item.cost_price) || 0,
          Number(item.unit_price) || 0,
          lineSubtotal
        );
      }

      return transactionId;
    });

    const newTxId = processCheckout();
    const createdTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(newTxId) as any;
    const details = db.prepare('SELECT * FROM transaction_details WHERE transaction_id = ?').all(newTxId);
    const settings = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan dan stok terpotong',
      data: {
        ...createdTx,
        details,
        settings,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memproses transaksi: ' + err.message });
  }
});

// VOID / CANCEL TRANSACTION (ROLLBACK STOCK)
apiRouter.post('/transactions/:id/cancel', (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole === 'pramuniaga') {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Pramuniaga tidak berhak membatalkan/void transaksi! Harap hubungi Admin atau Manager/Owner.',
      });
    }

    const { id } = req.params;
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }
    if (tx.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Transaksi ini sudah dibatalkan sebelumnya' });
    }

    const cancelTransaction = db.transaction(() => {
      // 1. Mark as cancelled
      db.prepare("UPDATE transactions SET status = 'cancelled' WHERE id = ?").run(id);

      // 2. Rollback inventory stock
      const details = db.prepare('SELECT * FROM transaction_details WHERE transaction_id = ?').all(id) as any[];
      const restoreStockStmt = db.prepare('UPDATE items SET stock_pcs = stock_pcs + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

      for (const item of details) {
        restoreStockStmt.run(item.total_pcs, item.item_id);
      }
    });

    cancelTransaction();
    res.json({ success: true, message: 'Transaksi berhasil dibatalkan dan stok dikembalikan ke etalase' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// STORE SETTINGS & THERMAL PRINTER CONFIG
// ==========================================
apiRouter.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const { store_name, address, city, phone, receipt_footer, paper_size, auto_print } = req.body;
    db.prepare(`
      UPDATE store_settings
      SET store_name = ?, address = ?, city = ?, phone = ?, receipt_footer = ?, paper_size = ?, auto_print = ?
      WHERE id = 1
    `).run(
      store_name || 'GROSIR MAKMUR JAYA',
      address || '',
      city || '',
      phone || '',
      receipt_footer || '',
      paper_size || '58mm',
      auto_print ? 1 : 0
    );
    const updated = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();
    res.json({ success: true, data: updated, message: 'Pengaturan toko & printer berhasil diperbarui' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// STATS & DASHBOARD METRICS
// ==========================================
apiRouter.get('/stats', (req: Request, res: Response) => {
  try {
    const todaySales = db.prepare(`
      SELECT 
        COALESCE(SUM(grand_total), 0) as total_omzet,
        COUNT(id) as total_transactions,
        COALESCE(SUM(total_items_count), 0) as total_items_sold
      FROM transactions 
      WHERE date(created_at) = date('now') AND status = 'completed'
    `).get() as any;

    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM items WHERE is_active = 1').get() as any;
    const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM items WHERE is_active = 1 AND stock_pcs <= min_stock_alert').get() as any;

    const topItems = db.prepare(`
      SELECT 
        td.item_name,
        SUM(td.quantity) as total_qty,
        td.unit_name,
        SUM(td.subtotal) as total_sales
      FROM transaction_details td
      JOIN transactions t ON td.transaction_id = t.id
      WHERE t.status = 'completed'
      GROUP BY td.item_name, td.unit_name
      ORDER BY total_sales DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        today_omzet: todaySales.total_omzet,
        today_transactions: todaySales.total_transactions,
        today_items_sold: todaySales.total_items_sold,
        total_products: totalProducts.count,
        low_stock_count: lowStockCount.count,
        top_items: topItems,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
