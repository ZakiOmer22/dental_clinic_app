const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

/* ============================================================
   LOW STOCK ALERTS
============================================================ */

router.get('/alerts', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT *
      FROM vw_low_stock
      WHERE clinic_id = $1
      ORDER BY units_needed DESC
    `, [req.user.clinicId]);

    res.json(rows);
  } catch (err) {
    console.error('alerts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ============================================================
   GET INVENTORY
============================================================ */

router.get('/', auth, async (req, res) => {
  try {
    const { category, lowstock, page = 1, limit = 50 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let where = `WHERE clinic_id = $1 AND is_active = TRUE`;
    const params = [req.user.clinicId];

    if (category) {
      params.push(category);
      where += ` AND category = $${params.length}`;
    }

    if (lowstock === 'true') {
      where += ` AND quantity_in_stock <= minimum_stock_level`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM inventory_items ${where}`,
      params
    );

    const dataParams = [...params, Number(limit), offset];

    const { rows } = await pool.query(
      `SELECT *
       FROM inventory_items
       ${where}
       ORDER BY name ASC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      data: rows,
      total: parseInt(countRes.rows[0].count, 10)
    });

  } catch (err) {
    console.error('inventory GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ============================================================
   CREATE ITEM
============================================================ */

router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      category,
      unit,
      unitCost,
      quantityInStock,
      minimumStockLevel,
      supplierName,
      expiryDate
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const { rows } = await pool.query(`
      INSERT INTO inventory_items
      (clinic_id, name, category, unit, unit_cost,
       quantity_in_stock, minimum_stock_level,
       supplier_name, expiry_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      req.user.clinicId,
      name,
      category || null,
      unit || 'pcs',
      unitCost || 0,
      quantityInStock || 0,
      minimumStockLevel || 5,
      supplierName || null,
      expiryDate || null
    ]);

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ============================================================
   UPDATE ITEM
============================================================ */

router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      category,
      unit,
      unitCost,
      minimumStockLevel,
      supplierName,
      expiryDate
    } = req.body;

    const { rows } = await pool.query(`
      UPDATE inventory_items SET
        name=$1,
        category=$2,
        unit=$3,
        unit_cost=$4,
        minimum_stock_level=$5,
        supplier_name=$6,
        expiry_date=$7,
        updated_at=NOW()
      WHERE id=$8 AND clinic_id=$9
      RETURNING *
    `, [
      name,
      category || null,
      unit || 'pcs',
      unitCost || 0,
      minimumStockLevel || 5,
      supplierName || null,
      expiryDate || null,
      req.params.id,
      req.user.clinicId
    ]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ============================================================
   STOCK TRANSACTION (ATOMIC)
============================================================ */

router.post('/transaction', auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { itemId, transactionType, quantity, reason } = req.body;

    if (!itemId || !quantity) {
      return res.status(400).json({ error: 'Item and quantity required' });
    }

    const { rows } = await client.query(`
      SELECT quantity_in_stock
      FROM inventory_items
      WHERE id=$1 AND clinic_id=$2
    `, [itemId, req.user.clinicId]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const qtyBefore = rows[0].quantity_in_stock;

    const delta =
      transactionType === 'received'
        ? Math.abs(quantity)
        : -Math.abs(quantity);

    const qtyAfter = qtyBefore + delta;

    if (qtyAfter < 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    await client.query(`
      UPDATE inventory_items
      SET quantity_in_stock=$1, updated_at=NOW()
      WHERE id=$2
    `, [qtyAfter, itemId]);

    const result = await client.query(`
      INSERT INTO inventory_transactions
      (item_id, user_id, transaction_type,
       quantity, quantity_before, quantity_after, reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [
      itemId,
      req.user.id,
      transactionType,
      quantity,
      qtyBefore,
      qtyAfter,
      reason || null
    ]);

    await client.query('COMMIT');

    res.status(201).json(result.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('transaction error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;