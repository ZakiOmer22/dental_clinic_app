const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class LabService {
  /**
   * Generate lab order number
   */
  async generateOrderNumber(clinicId) {
    const year = new Date().getFullYear();
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM lab_orders 
       WHERE clinic_id = $1 AND created_at >= $2`,
      [clinicId, `${year}-01-01`]
    );
    
    const count = parseInt(rows[0].count) + 1;
    return `LAB-${year}-${count.toString().padStart(5, '0')}`;
  }

  /**
   * Get all labs
   */
  async getLabs(clinicId, includeInactive = false) {
    let query = `
      SELECT 
        l.id, l.clinic_id, l.name, l.code, l.contact_person,
        l.email, l.phone, l.mobile, l.address, l.city, l.state,
        l.zip_code, l.country, l.website, l.specialties, l.price_list,
        l.default_turnaround_days, l.shipping_methods, l.notes,
        l.is_active, l.rating, l.created_at, l.updated_at,
        (SELECT COUNT(*) FROM lab_orders WHERE lab_id = l.id) as total_orders,
        (SELECT AVG(rating) FROM lab_orders WHERE lab_id = l.id AND rating IS NOT NULL) as avg_rating
      FROM labs l
      WHERE l.clinic_id = $1
    `;
    
    const params = [clinicId];
    
    if (!includeInactive) {
      query += ` AND l.is_active = true`;
    }
    
    query += ` ORDER BY l.name ASC`;
    
    const { rows } = await pool.query(query, params);
    return rows.map(this.formatLab);
  }

  /**
   * Get single lab
   */
  async getLabById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        l.id, l.clinic_id, l.name, l.code, l.contact_person,
        l.email, l.phone, l.mobile, l.address, l.city, l.state,
        l.zip_code, l.country, l.website, l.specialties, l.price_list,
        l.default_turnaround_days, l.shipping_methods, l.notes,
        l.is_active, l.rating, l.created_at, l.updated_at
      FROM labs l
      WHERE l.id = $1 AND l.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) {
      throw new NotFoundError('Lab');
    }

    return this.formatLab(rows[0]);
  }

  /**
   * Create lab
   */
  async createLab(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO labs (
        clinic_id, name, code, contact_person, email, phone, mobile,
        address, city, state, zip_code, country, website,
        specialties, price_list, default_turnaround_days,
        shipping_methods, notes, is_active, rating, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        clinicId, data.name, data.code || null, data.contactPerson || null,
        data.email || null, data.phone, data.mobile || null,
        data.address || null, data.city || null, data.state || null,
        data.zipCode || null, data.country || 'USA', data.website || null,
        JSON.stringify(data.specialties || []), JSON.stringify(data.priceList || {}),
        data.defaultTurnaroundDays || 7, JSON.stringify(data.shippingMethods || ['Standard']),
        data.notes || null, data.isActive !== false, data.rating || null,
        userId, userId,
      ]
    );

    return this.formatLab(rows[0]);
  }

  /**
   * Get all lab orders
   */
    async getLabOrders(clinicId, filters = {}) {
    const {
      page = 1, limit = 20, patientId, dentistId, status, fromDate, toDate,
      sortBy = 'sentDate', sortOrder = 'DESC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let paramIndex = 2;
    let whereClause = 'WHERE lo.clinic_id = $1';

    if (patientId) { whereClause += ` AND lo.patient_id = $${paramIndex}`; params.push(patientId); paramIndex++; }
    if (dentistId) { whereClause += ` AND lo.doctor_id = $${paramIndex}`; params.push(dentistId); paramIndex++; }
    if (status) { whereClause += ` AND lo.status = $${paramIndex}`; params.push(status); paramIndex++; }
    if (fromDate) { whereClause += ` AND lo.sent_date >= $${paramIndex}`; params.push(fromDate); paramIndex++; }
    if (toDate) { whereClause += ` AND lo.sent_date <= $${paramIndex}`; params.push(toDate); paramIndex++; }

    const countResult = await pool.query(`SELECT COUNT(*) FROM lab_orders lo ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const sortCol = { sentDate: 'lo.sent_date', expectedDate: 'lo.expected_date', status: 'lo.status', patientName: 'pat.full_name' }[sortBy] || 'lo.sent_date';

    const dataResult = await pool.query(
      `SELECT lo.id, lo.clinic_id, lo.treatment_id, lo.patient_id, lo.doctor_id,
              lo.lab_name, lo.order_type, lo.shade, lo.instructions,
              lo.sent_date, lo.expected_date, lo.received_date, lo.status, lo.cost, lo.notes, lo.created_at,
              pat.full_name as patient_name, pat.patient_number,
              u.full_name as doctor_name
       FROM lab_orders lo
       LEFT JOIN patients pat ON lo.patient_id = pat.id
       LEFT JOIN users u ON lo.doctor_id = u.id
       ${whereClause}
       ORDER BY ${sortCol} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      orders: dataResult.rows.map(row => this.formatLabOrder(row)),
      pagination: { page, limit, total },
    };
  }

  /**
   * Get single lab order
   */
  async getLabOrderById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        lo.id, lo.clinic_id, lo.order_number, lo.patient_id,
        lo.dentist_id, lo.appointment_id, lo.lab_id, lo.order_date,
        lo.due_date, lo.status, lo.notes, lo.shipping_address,
        lo.preferred_shipping_method, lo.is_rush, lo.rush_fee,
        lo.subtotal, lo.tax_amount, lo.total_amount,
        lo.received_date, lo.rating, lo.feedback,
        lo.created_at, lo.updated_at, lo.created_by, lo.updated_by,
        pat.first_name as patient_first_name, pat.last_name as patient_last_name,
        pat.phone as patient_phone, pat.email as patient_email,
        u.full_name as dentist_name, u.email as dentist_email,
        l.name as lab_name, l.contact_person as lab_contact,
        l.phone as lab_phone, l.email as lab_email, l.address as lab_address,
        a.appointment_date, a.treatment_type,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM lab_orders lo
      LEFT JOIN patients pat ON lo.patient_id = pat.id
      LEFT JOIN users u ON lo.dentist_id = u.id
      LEFT JOIN labs l ON lo.lab_id = l.id
      LEFT JOIN appointments a ON lo.appointment_id = a.id
      LEFT JOIN users creator ON lo.created_by = creator.id
      LEFT JOIN users updater ON lo.updated_by = updater.id
      WHERE lo.id = $1 AND lo.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) {
      throw new NotFoundError('Lab order');
    }

    const order = rows[0];

    // Get items
    const itemsResult = await pool.query(
      `SELECT 
        loi.id, loi.treatment_id, loi.description, loi.tooth_number,
        loi.shade, loi.material, loi.quantity, loi.unit_price,
        loi.total_price, loi.status, loi.instructions, loi.is_rush,
        loi.completed_date, loi.received_quantity, loi.condition,
        loi.notes, t.name as treatment_name
      FROM lab_order_items loi
      LEFT JOIN treatments t ON loi.treatment_id = t.id
      WHERE loi.lab_order_id = $1
      ORDER BY loi.id`,
      [id]
    );

    return this.formatLabOrder(order, itemsResult.rows);
  }

  /**
   * Create lab order
   */
  async createLabOrder(data, userId, clinicId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate order number
      const orderNumber = await this.generateOrderNumber(clinicId);

      // Calculate totals
      let subtotal = 0;
      const rushFee = data.isRush ? 50 : 0; // Default rush fee

      const items = data.items.map(item => {
        const totalPrice = item.quantity * (item.unitPrice || 0);
        subtotal += totalPrice;
        return { ...item, totalPrice };
      });

      const taxAmount = subtotal * 0.08; // 8% tax
      const totalAmount = subtotal + taxAmount + rushFee;

      // Create order
      const orderResult = await client.query(
        `INSERT INTO lab_orders (
          clinic_id, order_number, patient_id, dentist_id, appointment_id,
          lab_id, order_date, due_date, status, notes, shipping_address,
          preferred_shipping_method, is_rush, rush_fee, subtotal,
          tax_amount, total_amount, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          clinicId, orderNumber, data.patientId, data.dentistId,
          data.appointmentId || null, data.labId, data.orderDate, data.dueDate,
          'draft', data.notes || null, data.shippingAddress || null,
          data.preferredShippingMethod || null, data.isRush || false, rushFee,
          subtotal, taxAmount, totalAmount, userId, userId,
        ]
      );

      const order = orderResult.rows[0];

      // Insert items
      for (const item of items) {
        await client.query(
          `INSERT INTO lab_order_items (
            lab_order_id, treatment_id, description, tooth_number,
            shade, material, quantity, unit_price, total_price,
            status, instructions, is_rush
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            order.id, item.treatmentId || null, item.description,
            item.toothNumber || null, item.shade || null, item.material || null,
            item.quantity, item.unitPrice || 0, item.totalPrice,
            'pending', item.instructions || null, item.isRush || false,
          ]
        );
      }

      await client.query('COMMIT');

      return await this.getLabOrderById(order.id, clinicId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update lab order status
   */
  async updateLabOrder(id, data, userId, clinicId) {
    const existing = await this.getLabOrderById(id, clinicId);

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      status: 'status',
      dueDate: 'due_date',
      notes: 'notes',
      shippingAddress: 'shipping_address',
      preferredShippingMethod: 'preferred_shipping_method',
      isRush: 'is_rush',
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
      `UPDATE lab_orders 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND clinic_id = $${paramIndex + 1}`,
      params
    );

    return await this.getLabOrderById(id, clinicId);
  }

  /**
   * Update item status
   */
  async updateItemStatus(orderId, itemId, data, userId, clinicId) {
    await this.getLabOrderById(orderId, clinicId);

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (data.status) {
      updates.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.notes) {
      updates.push(`notes = COALESCE(notes, '') || ' | ' || $${paramIndex}`);
      params.push(data.notes);
      paramIndex++;
    }

    if (data.completedDate) {
      updates.push(`completed_date = $${paramIndex}`);
      params.push(data.completedDate);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new ValidationError('No updates provided');
    }

    params.push(itemId, orderId);

    await pool.query(
      `UPDATE lab_order_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND lab_order_id = $${paramIndex + 1}`,
      params
    );

    return await this.getLabOrderById(orderId, clinicId);
  }

  /**
   * Receive lab order
   */
  async receiveOrder(id, data, userId, clinicId) {
    const order = await this.getLabOrderById(id, clinicId);

    if (order.status === 'delivered' || order.status === 'cancelled') {
      throw new ValidationError(`Order already ${order.status}`);
    }

    // Update received items
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await pool.query(
          `UPDATE lab_order_items 
           SET received_quantity = $1, condition = $2, status = 'delivered'
           WHERE id = $3 AND lab_order_id = $4`,
          [item.receivedQuantity, item.condition, item.itemId, id]
        );
      }
    }

    // Update order status
    await pool.query(
      `UPDATE lab_orders 
       SET status = 'delivered', received_date = $1, notes = COALESCE(notes, '') || ' | Received: ' || $2,
           updated_by = $3, updated_at = NOW()
       WHERE id = $4 AND clinic_id = $5`,
      [data.receivedDate, data.notes || '', userId, id, clinicId]
    );

    return await this.getLabOrderById(id, clinicId);
  }

  /**
   * Get lab statistics
   */
  async getLabStats(clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_orders,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_orders,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status NOT IN ('delivered', 'cancelled') THEN 1 END) as overdue_orders,
        COUNT(CASE WHEN is_rush = true THEN 1 END) as rush_orders,
        SUM(total_amount) as total_value,
        AVG(EXTRACT(DAY FROM (received_date - order_date))) as avg_turnaround_days
      FROM lab_orders
      WHERE clinic_id = $1`,
      [clinicId]
    );

    return rows[0];
  }

  /**
   * Format lab
   */
  formatLab(row) {
    return {
      id: row.id,
      clinicId: row.clinic_id,
      name: row.name,
      code: row.code,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      country: row.country,
      website: row.website,
      specialties: row.specialties ? JSON.parse(row.specialties) : [],
      priceList: row.price_list ? JSON.parse(row.price_list) : {},
      defaultTurnaroundDays: row.default_turnaround_days,
      shippingMethods: row.shipping_methods ? JSON.parse(row.shipping_methods) : [],
      notes: row.notes,
      isActive: row.is_active,
      rating: row.rating ? parseFloat(row.rating) : null,
      totalOrders: row.total_orders ? parseInt(row.total_orders) : 0,
      avgRating: row.avg_rating ? parseFloat(row.avg_rating) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

    /**
   * Format lab order
   */
  formatLabOrder(row, items = []) {
    const patientName = (row.patient_name || row.patient_first_name || '').trim();
    const doctorName = row.doctor_name || row.dentist_name || '';

    return {
      id: row.id,
      clinicId: row.clinic_id,
      orderNumber: row.order_number || null,
      patientId: row.patient_id,
      patient: {
        id: row.patient_id,
        firstName: row.patient_first_name || patientName.split(' ')[0] || '',
        lastName: row.patient_last_name || patientName.split(' ').slice(1).join(' ') || '',
        fullName: patientName,
        phone: row.patient_phone,
        email: row.patient_email,
      },
      patient_name: patientName,
      patient_number: row.patient_number,
      dentistId: row.dentist_id || row.doctor_id,
      doctorId: row.doctor_id,
      dentist: {
        id: row.dentist_id || row.doctor_id,
        name: row.dentist_name || doctorName,
        email: row.dentist_email,
      },
      dentist_name: row.dentist_name || doctorName,
      doctor_name: doctorName,
      appointmentId: row.appointment_id || null,
      appointment: row.appointment_id ? {
        id: row.appointment_id,
        date: row.appointment_date,
        treatmentType: row.treatment_type,
      } : null,
      labId: row.lab_id || null,
      lab: {
        id: row.lab_id,
        name: row.lab_name,
        contactPerson: row.lab_contact,
        phone: row.lab_phone,
        email: row.lab_email,
        address: row.lab_address,
      },
      lab_name: row.lab_name,
      treatmentId: row.treatment_id,
      order_type: row.order_type,
      shade: row.shade,
      instructions: row.instructions,
      orderDate: row.order_date || row.sent_date,
      sent_date: row.sent_date,
      sentDate: row.sent_date,
      dueDate: row.due_date || row.expected_date,
      expected_date: row.expected_date,
      expectedDate: row.expected_date,
      receivedDate: row.received_date,
      received_date: row.received_date,
      status: row.status || 'pending',
      notes: row.notes,
      shippingAddress: row.shipping_address || null,
      preferredShippingMethod: row.preferred_shipping_method || null,
      isRush: row.is_rush || false,
      rushFee: row.rush_fee ? parseFloat(row.rush_fee) : 0,
      amounts: {
        subtotal: row.subtotal ? parseFloat(row.subtotal) : 0,
        tax: row.tax_amount ? parseFloat(row.tax_amount) : 0,
        total: row.total_amount ? parseFloat(row.total_amount) : parseFloat(row.cost || 0),
      },
      cost: parseFloat(row.cost || 0),
      total_amount: row.total_amount ? parseFloat(row.total_amount) : parseFloat(row.cost || 0),
      rating: row.rating,
      feedback: row.feedback,
      items: (items || []).map(item => ({
        id: item.id,
        treatmentId: item.treatment_id,
        treatmentName: item.treatment_name,
        description: item.description,
        toothNumber: item.tooth_number,
        shade: item.shade,
        material: item.material,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price || 0),
        totalPrice: parseFloat(item.total_price || 0),
        status: item.status,
        instructions: item.instructions,
        isRush: item.is_rush,
        completedDate: item.completed_date,
        receivedQuantity: item.received_quantity,
        condition: item.condition,
        notes: item.notes,
      })),
      isOverdue: row.expected_date ? new Date(row.expected_date) < new Date() && 
                 !['delivered', 'cancelled', 'rejected'].includes(row.status) : false,
      createdAt: row.created_at,
      created_at: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      updated_at: row.updated_at || row.created_at,
      createdBy: row.created_by || null,
      updatedBy: row.updated_by || null,
      createdByName: row.created_by_name || null,
      updatedByName: row.updated_by_name || null,
    };
  }
}

module.exports = new LabService();