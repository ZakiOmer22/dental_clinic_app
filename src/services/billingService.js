const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class BillingService {
  /**
   * Generate invoice number
   */
  async generateInvoiceNumber(clinicId) {
    const year = new Date().getFullYear();
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM invoices 
       WHERE clinic_id = $1 AND created_at >= $2`,
      [clinicId, `${year}-01-01`]
    );
    
    const count = parseInt(rows[0].count) + 1;
    return `INV-${year}-${count.toString().padStart(5, '0')}`;
  }

  /**
   * Get all invoices
   */
  async getInvoices(clinicId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      patientId,
      status,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      overdue = false,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let paramIndex = 2;

    let whereClause = 'WHERE i.clinic_id = $1';
    
    if (patientId) {
      whereClause += ` AND i.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND i.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (fromDate) {
      whereClause += ` AND i.created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereClause += ` AND i.created_at <= $${paramIndex}`;
      params.push(toDate + ' 23:59:59');
      paramIndex++;
    }

    if (minAmount) {
      whereClause += ` AND i.total_amount >= $${paramIndex}`;
      params.push(minAmount);
      paramIndex++;
    }

    if (maxAmount) {
      whereClause += ` AND i.total_amount <= $${paramIndex}`;
      params.push(maxAmount);
      paramIndex++;
    }

    if (overdue) {
      whereClause += ` AND i.due_date < CURRENT_DATE AND i.status NOT IN ('paid', 'cancelled', 'refunded')`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM invoices i ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const sortColumn = {
      createdAt: 'i.created_at',
      dueDate: 'i.due_date',
      totalAmount: 'i.total_amount',
      status: 'i.status',
      invoiceNumber: 'i.invoice_number',
    }[sortBy] || 'i.created_at';

    const dataResult = await pool.query(
      `SELECT 
        i.id, i.clinic_id, i.invoice_number, i.patient_id,
        i.treatment_id, i.created_at as invoice_date, i.due_date,
        i.subtotal, i.tax_percent, i.tax_amount, 
        i.discount_type, i.discount_value, i.discount_amount,
        i.insurance_covered,
        i.total_amount, i.paid_amount as amount_paid, 
        (i.total_amount - COALESCE(i.paid_amount, 0)) as balance_due, 
        i.status,
        i.notes, i.created_at, i.updated_at, i.created_by, i.updated_by,
        COALESCE(p.full_name, '') as patient_name,
        p.email as patient_email, p.secondary_phone as patient_phone,
        p.address as patient_address,
        NULL as treatment_name, NULL as treatment_category,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN treatments t ON i.treatment_id = t.id
      LEFT JOIN users creator ON i.created_by = creator.id
      LEFT JOIN users updater ON i.updated_by = updater.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const invoices = (dataResult.rows || []).map(row => this.formatInvoice(row, [], []));

    return {
      invoices,
      pagination: { page, limit, total },
    };
  }

  /**
   * Get single invoice with items and payments
   */
  async getInvoiceById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        i.id, i.clinic_id, i.invoice_number, i.patient_id,
        i.treatment_id, i.created_at as invoice_date, i.due_date,
        i.subtotal, i.tax_percent, i.tax_amount, 
        i.discount_type, i.discount_value, i.discount_amount,
        i.insurance_covered,
        i.total_amount, i.paid_amount as amount_paid, 
        (i.total_amount - COALESCE(i.paid_amount, 0)) as balance_due, 
        i.status,
        i.notes, i.created_at, i.updated_at, i.created_by, i.updated_by,
        COALESCE(p.full_name, '') as patient_name,
        p.email as patient_email, p.secondary_phone as patient_phone,
        p.address as patient_address,
        NULL as treatment_name, NULL as treatment_category,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN treatments t ON i.treatment_id = t.id
      LEFT JOIN users creator ON i.created_by = creator.id
      LEFT JOIN users updater ON i.updated_by = updater.id
      WHERE i.id = $1 AND i.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) {
      throw new NotFoundError('Invoice');
    }

    const invoice = rows[0];

    // Get items
    const itemsResult = await pool.query(
      `SELECT 
        id, treatment_id, description, quantity,
        unit_price, discount, tax_rate, total_price
      FROM invoice_items
      WHERE invoice_id = $1
      ORDER BY id`,
      [id]
    );

    // Get payments
    const paymentsResult = await pool.query(
      `SELECT 
        id, amount, payment_date, payment_method,
        reference_number, notes, created_at
      FROM payments
      WHERE invoice_id = $1
      ORDER BY payment_date DESC`,
      [id]
    );

    return this.formatInvoice(invoice, itemsResult.rows || [], paymentsResult.rows || []);
  }

  /**
   * Create invoice
   */
  async createInvoice(data, userId, clinicId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(clinicId);

      // Calculate totals
      let subtotal = 0;
      let taxAmount = 0;
      let discountAmount = 0;

      const items = (data.items || []).map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemDiscount = item.discount || 0;
        const itemTax = (itemTotal - itemDiscount) * ((item.taxRate || 0) / 100);
        
        subtotal += itemTotal;
        discountAmount += itemDiscount;
        taxAmount += itemTax;

        return {
          ...item,
          totalPrice: itemTotal - itemDiscount + itemTax,
        };
      });

      const totalAmount = subtotal - discountAmount + taxAmount;
      const taxPercent = subtotal > 0 ? ((taxAmount / (subtotal - discountAmount || 1)) * 100) : 0;

      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          clinic_id, invoice_number, patient_id, treatment_id,
          subtotal, tax_percent, tax_amount, 
          discount_type, discount_value, discount_amount,
          insurance_covered, total_amount, paid_amount, 
          status, due_date, notes, created_by, updated_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING *`,
        [
          clinicId, invoiceNumber, data.patientId, data.treatmentId || null,
          subtotal, taxPercent, taxAmount,
          data.discountType || null, data.discountValue || 0, discountAmount,
          data.insuranceCovered || 0, totalAmount, 0,
          'unpaid', data.dueDate || null, data.notes || null, userId, userId,
        ]
      );

      const invoice = invoiceResult.rows[0];

      // Insert items
      for (const item of items) {
        await client.query(
          `INSERT INTO invoice_items (
            invoice_id, treatment_id, description, quantity,
            unit_price, discount, tax_rate, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            invoice.id, item.treatmentId || null, item.description,
            item.quantity, item.unitPrice, item.discount || 0,
            item.taxRate || 0, item.totalPrice,
          ]
        );
      }

      await client.query('COMMIT');

      return await this.getInvoiceById(invoice.id, clinicId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(id, data, userId, clinicId) {
    const existing = await this.getInvoiceById(id, clinicId);

    if (existing.status === 'paid' || existing.status === 'cancelled') {
      throw new ValidationError(`Cannot update ${existing.status} invoice`);
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      dueDate: 'due_date',
      status: 'status',
      notes: 'notes',
      discountType: 'discount_type',
      discountValue: 'discount_value',
      insuranceCovered: 'insurance_covered',
    };

    Object.entries(fieldMap).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(data[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return existing;
    }

    updates.push(`updated_by = $${paramIndex}`);
    params.push(userId);
    paramIndex++;

    updates.push(`updated_at = NOW()`);

    params.push(id, clinicId);

    await pool.query(
      `UPDATE invoices 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND clinic_id = $${paramIndex + 1}`,
      params
    );

    return await this.getInvoiceById(id, clinicId);
  }

  /**
   * Add payment to invoice
   */
  async addPayment(data, userId, clinicId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify invoice exists and belongs to clinic
      const invoiceResult = await client.query(
        `SELECT id, total_amount, COALESCE(paid_amount, 0) as paid_amount, 
                (total_amount - COALESCE(paid_amount, 0)) as balance_due, status 
         FROM invoices WHERE id = $1 AND clinic_id = $2`,
        [data.invoiceId, clinicId]
      );

      if (!invoiceResult.rows.length) {
        throw new NotFoundError('Invoice');
      }

      const invoice = invoiceResult.rows[0];

      if (invoice.status === 'cancelled' || invoice.status === 'refunded') {
        throw new ValidationError(`Cannot add payment to ${invoice.status} invoice`);
      }

      if (parseFloat(data.amount) > parseFloat(invoice.balance_due)) {
        throw new ValidationError(`Payment amount exceeds balance due of ${invoice.balance_due}`);
      }

      // Create payment record
      const paymentResult = await client.query(
        `INSERT INTO payments (
          invoice_id, amount, payment_date, payment_method,
          reference_number, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          data.invoiceId, data.amount, data.paymentDate,
          data.paymentMethod, data.referenceNumber || null,
          data.notes || null, userId,
        ]
      );

      // Update invoice amounts
      const newAmountPaid = parseFloat(invoice.paid_amount) + parseFloat(data.amount);
      const newBalanceDue = parseFloat(invoice.total_amount) - newAmountPaid;
      
      let newStatus = invoice.status;
      if (newBalanceDue <= 0.01) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partially_paid';
      }

      await client.query(
        `UPDATE invoices 
         SET paid_amount = $1, status = $2, updated_at = NOW()
         WHERE id = $3`,
        [newAmountPaid, newStatus, data.invoiceId]
      );

      await client.query('COMMIT');

      return paymentResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get payments
   */
  async getPayments(clinicId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      invoiceId,
      patientId,
      paymentMethod,
      fromDate,
      toDate,
      sortBy = 'paymentDate',
      sortOrder = 'DESC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let paramIndex = 2;

    let whereClause = 'WHERE i.clinic_id = $1';
    
    if (invoiceId) {
      whereClause += ` AND p.invoice_id = $${paramIndex}`;
      params.push(invoiceId);
      paramIndex++;
    }

    if (patientId) {
      whereClause += ` AND i.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
    }

    if (paymentMethod) {
      whereClause += ` AND p.payment_method = $${paramIndex}`;
      params.push(paymentMethod);
      paramIndex++;
    }

    if (fromDate) {
      whereClause += ` AND p.payment_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereClause += ` AND p.payment_date <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const sortColumn = {
      paymentDate: 'p.payment_date',
      amount: 'p.amount',
      paymentMethod: 'p.payment_method',
    }[sortBy] || 'p.payment_date';

    const dataResult = await pool.query(
      `SELECT 
        p.id, p.invoice_id, p.amount, p.payment_date,
        p.payment_method, p.reference_number, p.notes, p.created_at,
        i.invoice_number, i.patient_id, i.total_amount,
        COALESCE(pat.full_name, '') as patient_name,
        u.full_name as created_by_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN patients pat ON i.patient_id = pat.id
      LEFT JOIN users u ON p.created_by = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      payments: (dataResult.rows || []).map(row => ({
        id: row.id,
        invoiceId: row.invoice_id,
        invoiceNumber: row.invoice_number,
        patientId: row.patient_id,
        patientName: row.patient_name || null,
        amount: parseFloat(row.amount || 0),
        paymentDate: row.payment_date,
        paymentMethod: row.payment_method,
        referenceNumber: row.reference_number,
        notes: row.notes,
        createdAt: row.created_at,
        createdByName: row.created_by_name,
      })),
      pagination: { page, limit, total },
    };
  }

  /**
   * Get billing statistics
   */
  async getBillingStats(clinicId, fromDate, toDate) {
    const params = [clinicId];
    let dateFilter = '';
    let paramIndex = 2;

    if (fromDate) {
      dateFilter += ` AND created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      dateFilter += ` AND created_at <= $${paramIndex}`;
      params.push(toDate + ' 23:59:59');
      paramIndex++;
    }

    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_billed,
        COALESCE(SUM(COALESCE(paid_amount, 0)), 0) as total_paid,
        COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as total_outstanding,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
        COUNT(CASE WHEN status = 'partially_paid' THEN 1 END) as partial_invoices,
        COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_invoices
      FROM invoices
      WHERE clinic_id = $1 ${dateFilter}`,
      params
    );

    const stats = rows[0];
    return {
      totalInvoices: parseInt(stats.total_invoices) || 0,
      totalBilled: parseFloat(stats.total_billed) || 0,
      totalPaid: parseFloat(stats.total_paid) || 0,
      totalOutstanding: parseFloat(stats.total_outstanding) || 0,
      paidInvoices: parseInt(stats.paid_invoices) || 0,
      overdueInvoices: parseInt(stats.overdue_invoices) || 0,
      partialInvoices: parseInt(stats.partial_invoices) || 0,
      unpaidInvoices: parseInt(stats.unpaid_invoices) || 0,
    };
  }

  /**
   * Format invoice for response
   */
  formatInvoice(row, items = [], payments = []) {
  const safeItems = Array.isArray(items) ? items : [];
  const safePayments = Array.isArray(payments) ? payments : [];
  const fullName = (row.patient_name || '').trim();

  return {
    // Snake_case fields frontend uses directly
    id: row.id,
    invoice_number: row.invoice_number,
    patient_name: fullName,
    patientId: row.patient_id,
    created_at: row.invoice_date || row.created_at,
    invoice_date: row.invoice_date,
    due_date: row.due_date,
    total_amount: parseFloat(row.total_amount || 0),
    paid_amount: parseFloat(row.amount_paid || 0),
    balance_due: parseFloat(row.balance_due || 0),
    subtotal: parseFloat(row.subtotal || 0),
    tax_amount: parseFloat(row.tax_amount || 0),
    discount_amount: parseFloat(row.discount_amount || 0),
    status: row.status || 'unpaid',
    notes: row.notes || null,
    
    // CamelCase for nested (keep existing)
    clinicId: row.clinic_id,
    patient: {
      id: row.patient_id,
      firstName: fullName.split(' ')[0] || '',
      lastName: fullName.split(' ').slice(1).join(' ') || '',
      fullName: fullName,
      email: row.patient_email || null,
      phone: row.patient_phone || null,
      address: row.patient_address || null,
    },
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    amounts: {
      subtotal: parseFloat(row.subtotal || 0),
      taxPercent: parseFloat(row.tax_percent || 0),
      tax: parseFloat(row.tax_amount || 0),
      discountType: row.discount_type || null,
      discountValue: parseFloat(row.discount_value || 0),
      discount: parseFloat(row.discount_amount || 0),
      insuranceCovered: parseFloat(row.insurance_covered || 0),
      total: parseFloat(row.total_amount || 0),
      paid: parseFloat(row.amount_paid || 0),
      balanceDue: parseFloat(row.balance_due || 0),
    },
    items: safeItems.map(item => ({
      id: item.id,
      treatmentId: item.treatment_id || null,
      description: item.description || '',
      quantity: item.quantity || 0,
      unitPrice: parseFloat(item.unit_price || 0),
      discount: parseFloat(item.discount || 0),
      taxRate: parseFloat(item.tax_rate || 0),
      totalPrice: parseFloat(item.total_price || 0),
    })),
    payments: safePayments.map(p => ({
      id: p.id,
      amount: parseFloat(p.amount || 0),
      paymentDate: p.payment_date,
      paymentMethod: p.payment_method,
      referenceNumber: p.reference_number || null,
      notes: p.notes || null,
      createdAt: p.created_at,
    })),
    createdAt: row.created_at || row.invoice_date,
    updatedAt: row.updated_at,
  };
}
}

module.exports = new BillingService();