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
      sortBy = 'invoiceDate',
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
      whereClause += ` AND i.invoice_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereClause += ` AND i.invoice_date <= $${paramIndex}`;
      params.push(toDate);
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
      invoiceDate: 'i.invoice_date',
      dueDate: 'i.due_date',
      totalAmount: 'i.total_amount',
      status: 'i.status',
      invoiceNumber: 'i.invoice_number',
    }[sortBy] || 'i.invoice_date';

    const dataResult = await pool.query(
      `SELECT 
        i.id, i.clinic_id, i.invoice_number, i.patient_id,
        i.appointment_id, i.invoice_date, i.due_date,
        i.subtotal, i.tax_amount, i.discount_amount, i.total_amount,
        i.amount_paid, i.balance_due, i.status,
        i.notes, i.payment_terms, i.currency,
        i.created_at, i.updated_at, i.created_by, i.updated_by,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        p.email as patient_email, p.phone as patient_phone,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN users creator ON i.created_by = creator.id
      LEFT JOIN users updater ON i.updated_by = updater.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      invoices: dataResult.rows.map(this.formatInvoice),
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
        i.appointment_id, i.invoice_date, i.due_date,
        i.subtotal, i.tax_amount, i.discount_amount, i.total_amount,
        i.amount_paid, i.balance_due, i.status,
        i.notes, i.payment_terms, i.currency,
        i.created_at, i.updated_at, i.created_by, i.updated_by,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        p.email as patient_email, p.phone as patient_phone,
        p.address as patient_address,
        a.appointment_date, a.treatment_type,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN appointments a ON i.appointment_id = a.id
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

    return this.formatInvoice(invoice, itemsResult.rows, paymentsResult.rows);
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

      const items = data.items.map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemDiscount = item.discount || 0;
        const itemTax = (itemTotal - itemDiscount) * (item.taxRate / 100);
        
        subtotal += itemTotal;
        discountAmount += itemDiscount;
        taxAmount += itemTax;

        return {
          ...item,
          totalPrice: itemTotal - itemDiscount + itemTax,
        };
      });

      const totalAmount = subtotal - discountAmount + taxAmount;

      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          clinic_id, invoice_number, patient_id, appointment_id,
          invoice_date, due_date, subtotal, tax_amount, discount_amount,
          total_amount, amount_paid, balance_due, status,
          notes, payment_terms, currency, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          clinicId, invoiceNumber, data.patientId, data.appointmentId || null,
          data.invoiceDate, data.dueDate, subtotal, taxAmount, discountAmount,
          totalAmount, 0, totalAmount, 'draft',
          data.notes || null, data.paymentTerms || 'Due upon receipt',
          data.currency || 'USD', userId, userId,
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
      paymentTerms: 'payment_terms',
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
        `SELECT id, total_amount, amount_paid, balance_due, status 
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

      if (data.amount > invoice.balance_due) {
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
      const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(data.amount);
      const newBalanceDue = parseFloat(invoice.total_amount) - newAmountPaid;
      
      let newStatus = invoice.status;
      if (newBalanceDue <= 0.01) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partially_paid';
      }

      await client.query(
        `UPDATE invoices 
         SET amount_paid = $1, balance_due = $2, status = $3, updated_at = NOW()
         WHERE id = $4`,
        [newAmountPaid, newBalanceDue, newStatus, data.invoiceId]
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
        pat.first_name as patient_first_name, pat.last_name as patient_last_name,
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
      payments: dataResult.rows.map(row => ({
        id: row.id,
        invoiceId: row.invoice_id,
        invoiceNumber: row.invoice_number,
        patientId: row.patient_id,
        patientName: `${row.patient_first_name} ${row.patient_last_name}`,
        amount: parseFloat(row.amount),
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
      dateFilter += ` AND invoice_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      dateFilter += ` AND invoice_date <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_billed,
        SUM(amount_paid) as total_paid,
        SUM(balance_due) as total_outstanding,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
        COUNT(CASE WHEN status = 'partially_paid' THEN 1 END) as partial_invoices,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_invoices,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_invoices
      FROM invoices
      WHERE clinic_id = $1 ${dateFilter}`,
      params
    );

    return rows[0];
  }

  /**
   * Format invoice for response
   */
  formatInvoice(row, items = [], payments = []) {
    return {
      id: row.id,
      clinicId: row.clinic_id,
      invoiceNumber: row.invoice_number,
      patientId: row.patient_id,
      patient: {
        id: row.patient_id,
        firstName: row.patient_first_name,
        lastName: row.patient_last_name,
        email: row.patient_email,
        phone: row.patient_phone,
        address: row.patient_address,
      },
      appointmentId: row.appointment_id,
      appointment: row.appointment_id ? {
        id: row.appointment_id,
        date: row.appointment_date,
        treatmentType: row.treatment_type,
      } : null,
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      amounts: {
        subtotal: parseFloat(row.subtotal),
        tax: parseFloat(row.tax_amount),
        discount: parseFloat(row.discount_amount),
        total: parseFloat(row.total_amount),
        paid: parseFloat(row.amount_paid),
        balanceDue: parseFloat(row.balance_due),
      },
      status: row.status,
      notes: row.notes,
      paymentTerms: row.payment_terms,
      currency: row.currency,
      items: items.map(item => ({
        id: item.id,
        treatmentId: item.treatment_id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        discount: parseFloat(item.discount),
        taxRate: parseFloat(item.tax_rate),
        totalPrice: parseFloat(item.total_price),
      })),
      payments: payments.map(payment => ({
        id: payment.id,
        amount: parseFloat(payment.amount),
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        referenceNumber: payment.reference_number,
        notes: payment.notes,
        createdAt: payment.created_at,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdByName: row.created_by_name,
      updatedByName: row.updated_by_name,
    };
  }
}

module.exports = new BillingService();