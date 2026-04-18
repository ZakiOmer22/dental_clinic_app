const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class InventoryService {
  /**
   * Generate item code
   */
  async generateItemCode(category, clinicId) {
    const prefix = {
      consumables: 'CONS',
      instruments: 'INST',
      equipment: 'EQPT',
      medications: 'MEDS',
      sterilization: 'STER',
      ppe: 'PPE',
      office_supplies: 'OFFC',
      other: 'MISC',
    }[category] || 'ITEM';

    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM inventory_items 
       WHERE clinic_id = $1 AND category = $2`,
      [clinicId, category]
    );
    
    const count = parseInt(rows[0].count) + 1;
    return `${prefix}-${count.toString().padStart(5, '0')}`;
  }

  /**
   * Get all inventory items
   */
  async getItems(clinicId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      category,
      isActive,
      lowStock = false,
      expiringSoon = false,
      supplier,
      location,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let paramIndex = 2;

    let whereClause = 'WHERE i.clinic_id = $1';
    
    if (search) {
      whereClause += ` AND (
        i.name ILIKE $${paramIndex} OR 
        i.code ILIKE $${paramIndex} OR 
        i.supplier ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      whereClause += ` AND i.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereClause += ` AND i.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    if (lowStock) {
      whereClause += ` AND i.quantity <= i.min_quantity`;
    }

    if (expiringSoon) {
      whereClause += ` AND i.expiry_date IS NOT NULL 
        AND i.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND i.expiry_date >= CURRENT_DATE`;
    }

    if (supplier) {
      whereClause += ` AND i.supplier = $${paramIndex}`;
      params.push(supplier);
      paramIndex++;
    }

    if (location) {
      whereClause += ` AND i.location = $${paramIndex}`;
      params.push(location);
      paramIndex++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM inventory_items i ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const sortColumn = {
      name: 'i.name',
      category: 'i.category',
      quantity: 'i.quantity',
      unitPrice: 'i.unit_price',
      updatedAt: 'i.updated_at',
    }[sortBy] || 'i.name';

    const dataResult = await pool.query(
      `SELECT 
        i.id, i.clinic_id, i.name, i.code, i.category,
        i.description, i.unit, i.quantity, i.min_quantity,
        i.max_quantity, i.unit_price, i.selling_price,
        i.supplier, i.supplier_code, i.location,
        i.expiry_date, i.batch_number, i.requires_prescription,
        i.is_active, i.notes, i.created_at, i.updated_at,
        i.created_by, i.updated_by,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM inventory_items i
      LEFT JOIN users creator ON i.created_by = creator.id
      LEFT JOIN users updater ON i.updated_by = updater.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      items: dataResult.rows.map(this.formatItem),
      pagination: { page, limit, total },
    };
  }

  /**
   * Get single item
   */
  async getItemById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        i.id, i.clinic_id, i.name, i.code, i.category,
        i.description, i.unit, i.quantity, i.min_quantity,
        i.max_quantity, i.unit_price, i.selling_price,
        i.supplier, i.supplier_code, i.location,
        i.expiry_date, i.batch_number, i.requires_prescription,
        i.is_active, i.notes, i.created_at, i.updated_at,
        i.created_by, i.updated_by,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM inventory_items i
      LEFT JOIN users creator ON i.created_by = creator.id
      LEFT JOIN users updater ON i.updated_by = updater.id
      WHERE i.id = $1 AND i.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) {
      throw new NotFoundError('Inventory item');
    }

    return this.formatItem(rows[0]);
  }

  /**
   * Create item
   */
  async createItem(data, userId, clinicId) {
    // Generate code if not provided
    const code = data.code || await this.generateItemCode(data.category, clinicId);

    const { rows } = await pool.query(
      `INSERT INTO inventory_items (
        clinic_id, name, code, category, description, unit,
        quantity, min_quantity, max_quantity, unit_price, selling_price,
        supplier, supplier_code, location, expiry_date, batch_number,
        requires_prescription, is_active, notes, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        clinicId, data.name, code, data.category, data.description || null,
        data.unit, data.quantity || 0, data.minQuantity || 5, data.maxQuantity || 100,
        data.unitPrice, data.sellingPrice || null, data.supplier || null,
        data.supplierCode || null, data.location || null, data.expiryDate || null,
        data.batchNumber || null, data.requiresPrescription || false,
        data.isActive !== false, data.notes || null, userId, userId,
      ]
    );

    // Log initial stock if quantity > 0
    if (data.quantity > 0) {
      await this.logTransaction({
        itemId: rows[0].id,
        type: 'in',
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        supplier: data.supplier,
        notes: 'Initial stock',
      }, userId, clinicId);
    }

    return await this.getItemById(rows[0].id, clinicId);
  }

  /**
   * Update item
   */
  async updateItem(id, data, userId, clinicId) {
    const existing = await this.getItemById(id, clinicId);

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      name: 'name',
      code: 'code',
      category: 'category',
      description: 'description',
      unit: 'unit',
      minQuantity: 'min_quantity',
      maxQuantity: 'max_quantity',
      unitPrice: 'unit_price',
      sellingPrice: 'selling_price',
      supplier: 'supplier',
      supplierCode: 'supplier_code',
      location: 'location',
      expiryDate: 'expiry_date',
      batchNumber: 'batch_number',
      requiresPrescription: 'requires_prescription',
      isActive: 'is_active',
      notes: 'notes',
    };

    Object.entries(fieldMap).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(data[key]);
        paramIndex++;
      }
    });

    updates.push(`updated_by = $${paramIndex}`);
    params.push(userId);
    paramIndex++;

    updates.push(`updated_at = NOW()`);

    params.push(id, clinicId);

    await pool.query(
      `UPDATE inventory_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND clinic_id = $${paramIndex + 1}`,
      params
    );

    return await this.getItemById(id, clinicId);
  }

  /**
   * Stock in
   */
  async stockIn(data, userId, clinicId) {
    const item = await this.getItemById(data.itemId, clinicId);

    const newQuantity = item.quantity + data.quantity;

    await pool.query(
      `UPDATE inventory_items 
       SET quantity = $1, unit_price = $2, supplier = COALESCE($3, supplier),
           batch_number = COALESCE($4, batch_number), expiry_date = COALESCE($5, expiry_date),
           updated_at = NOW(), updated_by = $6
       WHERE id = $7 AND clinic_id = $8`,
      [
        newQuantity, data.unitPrice || item.unitPrice, data.supplier,
        data.batchNumber, data.expiryDate, userId, data.itemId, clinicId,
      ]
    );

    await this.logTransaction({
      itemId: data.itemId,
      type: 'in',
      quantity: data.quantity,
      unitPrice: data.unitPrice || item.unitPrice,
      supplier: data.supplier,
      invoiceNumber: data.invoiceNumber,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate,
      notes: data.notes,
    }, userId, clinicId);

    return await this.getItemById(data.itemId, clinicId);
  }

  /**
   * Stock out
   */
  async stockOut(data, userId, clinicId) {
    const item = await this.getItemById(data.itemId, clinicId);

    if (item.quantity < data.quantity) {
      throw new ValidationError(`Insufficient stock. Available: ${item.quantity}`);
    }

    const newQuantity = item.quantity - data.quantity;

    await pool.query(
      `UPDATE inventory_items 
       SET quantity = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3 AND clinic_id = $4`,
      [newQuantity, userId, data.itemId, clinicId]
    );

    await this.logTransaction({
      itemId: data.itemId,
      type: 'out',
      quantity: data.quantity,
      unitPrice: item.unitPrice,
      reason: data.reason,
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      notes: data.notes,
    }, userId, clinicId);

    return await this.getItemById(data.itemId, clinicId);
  }

  /**
   * Log transaction
   */
  async logTransaction(data, userId, clinicId) {
    await pool.query(
      `INSERT INTO inventory_transactions (
        item_id, clinic_id, type, quantity, unit_price, total_price,
        supplier, invoice_number, batch_number, expiry_date,
        reason, patient_id, appointment_id, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        data.itemId, clinicId, data.type, data.quantity,
        data.unitPrice, data.quantity * data.unitPrice,
        data.supplier || null, data.invoiceNumber || null,
        data.batchNumber || null, data.expiryDate || null,
        data.reason || null, data.patientId || null,
        data.appointmentId || null, data.notes || null, userId,
      ]
    );
  }

  /**
   * Get transactions
   */
  async getTransactions(clinicId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      itemId,
      type,
      fromDate,
      toDate,
      sortBy = 'transactionDate',
      sortOrder = 'DESC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let paramIndex = 2;

    let whereClause = 'WHERE t.clinic_id = $1';
    
    if (itemId) {
      whereClause += ` AND t.item_id = $${paramIndex}`;
      params.push(itemId);
      paramIndex++;
    }

    if (type) {
      whereClause += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (fromDate) {
      whereClause += ` AND t.created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereClause += ` AND t.created_at <= $${paramIndex}`;
      params.push(toDate + ' 23:59:59');
      paramIndex++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM inventory_transactions t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const sortColumn = {
      transactionDate: 't.created_at',
      quantity: 't.quantity',
      type: 't.type',
    }[sortBy] || 't.created_at';

    const dataResult = await pool.query(
      `SELECT 
        t.id, t.item_id, t.type, t.quantity, t.unit_price,
        t.total_price, t.supplier, t.invoice_number,
        t.batch_number, t.expiry_date, t.reason,
        t.patient_id, t.appointment_id, t.notes, t.created_at,
        i.name as item_name, i.code as item_code, i.unit as item_unit,
        pat.first_name as patient_first_name, pat.last_name as patient_last_name,
        u.full_name as created_by_name
      FROM inventory_transactions t
      LEFT JOIN inventory_items i ON t.item_id = i.id
      LEFT JOIN patients pat ON t.patient_id = pat.id
      LEFT JOIN users u ON t.created_by = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      transactions: dataResult.rows.map(row => ({
        id: row.id,
        itemId: row.item_id,
        itemName: row.item_name,
        itemCode: row.item_code,
        itemUnit: row.item_unit,
        type: row.type,
        quantity: row.quantity,
        unitPrice: parseFloat(row.unit_price),
        totalPrice: parseFloat(row.total_price),
        supplier: row.supplier,
        invoiceNumber: row.invoice_number,
        batchNumber: row.batch_number,
        expiryDate: row.expiry_date,
        reason: row.reason,
        patientId: row.patient_id,
        patientName: row.patient_first_name ? 
          `${row.patient_first_name} ${row.patient_last_name}` : null,
        appointmentId: row.appointment_id,
        notes: row.notes,
        createdAt: row.created_at,
        createdByName: row.created_by_name,
      })),
      pagination: { page, limit, total },
    };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        id, name, code, category, quantity, min_quantity,
        unit, location, supplier
      FROM inventory_items
      WHERE clinic_id = $1 
        AND is_active = true 
        AND quantity <= min_quantity
      ORDER BY (min_quantity - quantity) DESC`,
      [clinicId]
    );

    return rows.map(row => ({
      ...row,
      shortage: row.min_quantity - row.quantity,
      severity: row.quantity === 0 ? 'critical' : 
                row.quantity <= row.min_quantity / 2 ? 'warning' : 'info',
    }));
  }

  /**
   * Get expiring items
   */
  async getExpiringItems(clinicId, daysThreshold = 30) {
    const { rows } = await pool.query(
      `SELECT 
        id, name, code, category, quantity, expiry_date,
        batch_number, location
      FROM inventory_items
      WHERE clinic_id = $1 
        AND is_active = true 
        AND expiry_date IS NOT NULL
        AND expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $2
        AND expiry_date >= CURRENT_DATE
      ORDER BY expiry_date ASC`,
      [clinicId, daysThreshold]
    );

    return rows.map(row => ({
      ...row,
      daysUntilExpiry: Math.ceil((new Date(row.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)),
    }));
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_items,
        COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_items,
        SUM(quantity * unit_price) as total_value,
        COUNT(DISTINCT category) as category_count,
        COUNT(DISTINCT supplier) as supplier_count,
        COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' 
              AND expiry_date >= CURRENT_DATE THEN 1 END) as expiring_soon
      FROM inventory_items
      WHERE clinic_id = $1`,
      [clinicId]
    );

    return rows[0];
  }

  /**
   * Format item for response
   */
  formatItem(row) {
    return {
      id: row.id,
      clinicId: row.clinic_id,
      name: row.name,
      code: row.code,
      category: row.category,
      description: row.description,
      unit: row.unit,
      quantity: row.quantity,
      minQuantity: row.min_quantity,
      maxQuantity: row.max_quantity,
      unitPrice: parseFloat(row.unit_price),
      sellingPrice: row.selling_price ? parseFloat(row.selling_price) : null,
      stockValue: row.quantity * parseFloat(row.unit_price),
      supplier: row.supplier,
      supplierCode: row.supplier_code,
      location: row.location,
      expiryDate: row.expiry_date,
      batchNumber: row.batch_number,
      requiresPrescription: row.requires_prescription,
      isActive: row.is_active,
      notes: row.notes,
      status: row.quantity === 0 ? 'out_of_stock' :
               row.quantity <= row.min_quantity ? 'low_stock' : 'in_stock',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdByName: row.created_by_name,
      updatedByName: row.updated_by_name,
    };
  }
}

module.exports = new InventoryService();