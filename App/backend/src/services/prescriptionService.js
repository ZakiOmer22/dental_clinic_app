const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class PrescriptionService {
  /**
   * Generate prescription number
   */
  async generatePrescriptionNumber(clinicId) {
    const year = new Date().getFullYear();
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM prescriptions 
       WHERE clinic_id = $1 AND created_at >= $2`,
      [clinicId, `${year}-01-01`]
    );
    
    const count = parseInt(rows[0].count) + 1;
    return `RX-${year}-${count.toString().padStart(6, '0')}`;
  }

  /**
   * Get all prescriptions
   */
  async getPrescriptions(clinicId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      patientId,
      dentistId,
      status,
      fromDate,
      toDate,
      isControlledSubstance,
      medicationName,
      sortBy = 'prescriptionDate',
      sortOrder = 'DESC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let paramIndex = 2;

    let whereClause = 'WHERE p.clinic_id = $1';
    
    if (patientId) {
      whereClause += ` AND p.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
    }

    if (dentistId) {
      whereClause += ` AND p.dentist_id = $${paramIndex}`;
      params.push(dentistId);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (fromDate) {
      whereClause += ` AND p.prescription_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereClause += ` AND p.prescription_date <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    if (isControlledSubstance !== undefined) {
      whereClause += ` AND p.is_controlled_substance = $${paramIndex}`;
      params.push(isControlledSubstance);
      paramIndex++;
    }

    if (medicationName) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM prescription_items pi 
        WHERE pi.prescription_id = p.id 
          AND pi.medication_name ILIKE $${paramIndex}
      )`;
      params.push(`%${medicationName}%`);
      paramIndex++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM prescriptions p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const sortColumn = {
      prescriptionDate: 'p.prescription_date',
      status: 'p.status',
      patientName: 'pat.first_name',
    }[sortBy] || 'p.prescription_date';

    const dataResult = await pool.query(
      `SELECT 
        p.id, p.clinic_id, p.prescription_number, p.patient_id,
        p.appointment_id, p.dentist_id, p.prescription_date,
        p.diagnosis, p.notes, p.status, p.pharmacy_name,
        p.pharmacy_phone, p.pharmacy_address, p.is_controlled_substance,
        p.dea_number, p.dispensed_date, p.dispensed_by,
        p.created_at, p.updated_at, p.created_by, p.updated_by,
        pat.first_name as patient_first_name, pat.last_name as patient_last_name,
        pat.date_of_birth as patient_dob, pat.gender as patient_gender,
        u.full_name as dentist_name, u.email as dentist_email,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM prescriptions p
      LEFT JOIN patients pat ON p.patient_id = pat.id
      LEFT JOIN users u ON p.dentist_id = u.id
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN users updater ON p.updated_by = updater.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      prescriptions: await Promise.all(
        dataResult.rows.map(row => this.formatPrescription(row))
      ),
      pagination: { page, limit, total },
    };
  }

  /**
   * Get single prescription with items and refills
   */
  async getPrescriptionById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        p.id, p.clinic_id, p.prescription_number, p.patient_id,
        p.appointment_id, p.dentist_id, p.prescription_date,
        p.diagnosis, p.notes, p.status, p.pharmacy_name,
        p.pharmacy_phone, p.pharmacy_address, p.is_controlled_substance,
        p.dea_number, p.dispensed_date, p.dispensed_by,
        p.created_at, p.updated_at, p.created_by, p.updated_by,
        pat.first_name as patient_first_name, pat.last_name as patient_last_name,
        pat.date_of_birth as patient_dob, pat.gender as patient_gender,
        pat.allergies as patient_allergies, pat.medical_history as patient_medical_history,
        u.full_name as dentist_name, u.email as dentist_email,
        a.appointment_date, a.treatment_type,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM prescriptions p
      LEFT JOIN patients pat ON p.patient_id = pat.id
      LEFT JOIN users u ON p.dentist_id = u.id
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN users updater ON p.updated_by = updater.id
      WHERE p.id = $1 AND p.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) {
      throw new NotFoundError('Prescription');
    }

    const prescription = rows[0];

    // Get items
    const itemsResult = await pool.query(
      `SELECT 
        id, medication_name, generic_name, strength, form,
        dosage, frequency, duration, quantity, refills,
        instructions, warnings, start_date, end_date, is_prn
      FROM prescription_items
      WHERE prescription_id = $1
      ORDER BY id`,
      [id]
    );

    // Get refills
    const refillsResult = await pool.query(
      `SELECT 
        id, refill_date, quantity, pharmacy_name, notes, created_by,
        u.full_name as created_by_name
      FROM prescription_refills r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE prescription_id = $1
      ORDER BY refill_date DESC`,
      [id]
    );

    return this.formatPrescription(prescription, itemsResult.rows, refillsResult.rows);
  }

  /**
   * Create prescription
   */
  async createPrescription(data, userId, clinicId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate prescription number
      const prescriptionNumber = await this.generatePrescriptionNumber(clinicId);

      // Create prescription
      const prescriptionResult = await client.query(
        `INSERT INTO prescriptions (
          clinic_id, prescription_number, patient_id, appointment_id,
          dentist_id, prescription_date, diagnosis, notes, status,
          pharmacy_name, pharmacy_phone, pharmacy_address,
          is_controlled_substance, dea_number, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          clinicId, prescriptionNumber, data.patientId, data.appointmentId || null,
          data.dentistId, data.prescriptionDate, data.diagnosis || null,
          data.notes || null, 'active', data.pharmacyName || null,
          data.pharmacyPhone || null, data.pharmacyAddress || null,
          data.isControlledSubstance || false, data.deaNumber || null,
          userId, userId,
        ]
      );

      const prescription = prescriptionResult.rows[0];
      let totalRefills = 0;

      // Insert items
      for (const item of data.medications) {
        await client.query(
          `INSERT INTO prescription_items (
            prescription_id, medication_name, generic_name, strength,
            form, dosage, frequency, duration, quantity, refills,
            instructions, warnings, start_date, end_date, is_prn
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            prescription.id, item.medicationName, item.genericName || null,
            item.strength, item.form, item.dosage, item.frequency,
            item.duration, item.quantity, item.refills || 0,
            item.instructions || null, item.warnings || null,
            item.startDate || null, item.endDate || null, item.isPRN || false,
          ]
        );
        totalRefills += item.refills || 0;
      }

      await client.query('COMMIT');

      return await this.getPrescriptionById(prescription.id, clinicId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update prescription
   */
  async updatePrescription(id, data, userId, clinicId) {
    const existing = await this.getPrescriptionById(id, clinicId);

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      throw new ValidationError(`Cannot update ${existing.status} prescription`);
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      status: 'status',
      notes: 'notes',
      pharmacyName: 'pharmacy_name',
      pharmacyPhone: 'pharmacy_phone',
      pharmacyAddress: 'pharmacy_address',
      dispensedDate: 'dispensed_date',
      dispensedBy: 'dispensed_by',
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
      `UPDATE prescriptions 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND clinic_id = $${paramIndex + 1}`,
      params
    );

    return await this.getPrescriptionById(id, clinicId);
  }

  /**
   * Add refill
   */
  async addRefill(id, data, userId, clinicId) {
    const prescription = await this.getPrescriptionById(id, clinicId);

    if (prescription.status !== 'active') {
      throw new ValidationError(`Cannot refill ${prescription.status} prescription`);
    }

    // Check remaining refills
    const remainingRefills = prescription.items.reduce((sum, item) => sum + (item.refills || 0), 0);
    
    if (remainingRefills <= 0) {
      throw new ValidationError('No refills remaining on this prescription');
    }

    await pool.query(
      `INSERT INTO prescription_refills (
        prescription_id, refill_date, quantity, pharmacy_name, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id, data.refillDate, data.quantity,
        data.pharmacyName || null, data.notes || null, userId,
      ]
    );

    // Update prescription if all refills used
    const { rows } = await pool.query(
      `SELECT COUNT(*) as refill_count FROM prescription_refills WHERE prescription_id = $1`,
      [id]
    );

    const totalRefillsAllowed = prescription.items.reduce((sum, item) => sum + (item.refills || 0), 0);
    
    if (parseInt(rows[0].refill_count) >= totalRefillsAllowed) {
      await pool.query(
        `UPDATE prescriptions SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [id]
      );
    }

    return await this.getPrescriptionById(id, clinicId);
  }

  /**
   * Cancel prescription
   */
  async cancelPrescription(id, reason, userId, clinicId) {
    const existing = await this.getPrescriptionById(id, clinicId);

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      throw new ValidationError(`Prescription already ${existing.status}`);
    }

    await pool.query(
      `UPDATE prescriptions 
       SET status = 'cancelled', 
           notes = COALESCE(notes, '') || ' | Cancelled: ' || $1,
           updated_by = $2,
           updated_at = NOW()
       WHERE id = $3 AND clinic_id = $4`,
      [reason || 'No reason provided', userId, id, clinicId]
    );

    return { success: true };
  }

  /**
   * Get patient's active prescriptions
   */
  async getPatientPrescriptions(patientId, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        p.id, p.prescription_number, p.prescription_date,
        p.status, p.diagnosis, p.pharmacy_name,
        u.full_name as dentist_name
      FROM prescriptions p
      LEFT JOIN users u ON p.dentist_id = u.id
      WHERE p.patient_id = $1 AND p.clinic_id = $2
        AND p.status = 'active'
      ORDER BY p.prescription_date DESC`,
      [patientId, clinicId]
    );

    return await Promise.all(
      rows.map(row => this.formatPrescription(row))
    );
  }

  /**
   * Search medications (for autocomplete)
   */
  async searchMedications(search, limit = 20) {
    const { rows } = await pool.query(
      `SELECT DISTINCT 
        medication_name, generic_name, strength, form
      FROM prescription_items
      WHERE medication_name ILIKE $1 OR generic_name ILIKE $1
      ORDER BY medication_name
      LIMIT $2`,
      [`%${search}%`, limit]
    );

    return rows;
  }

  /**
   * Get prescription statistics
   */
  async getPrescriptionStats(clinicId, fromDate, toDate) {
    const params = [clinicId];
    let dateFilter = '';
    let paramIndex = 2;

    if (fromDate) {
      dateFilter += ` AND prescription_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      dateFilter += ` AND prescription_date <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_prescriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_prescriptions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_prescriptions,
        COUNT(CASE WHEN is_controlled_substance = true THEN 1 END) as controlled_substances,
        COUNT(DISTINCT patient_id) as unique_patients,
        COUNT(DISTINCT dentist_id) as prescribing_dentists
      FROM prescriptions
      WHERE clinic_id = $1 ${dateFilter}`,
      params
    );

    // Get most prescribed medications
    const medsResult = await pool.query(
      `SELECT 
        pi.medication_name, pi.generic_name, pi.strength, pi.form,
        COUNT(*) as prescription_count,
        SUM(pi.quantity) as total_quantity
      FROM prescription_items pi
      JOIN prescriptions p ON pi.prescription_id = p.id
      WHERE p.clinic_id = $1 ${dateFilter.replace('prescription_date', 'p.prescription_date')}
      GROUP BY pi.medication_name, pi.generic_name, pi.strength, pi.form
      ORDER BY prescription_count DESC
      LIMIT 10`,
      params
    );

    return {
      ...rows[0],
      top_medications: medsResult.rows,
    };
  }

  /**
   * Format prescription for response
   */
  async formatPrescription(row, items = [], refills = []) {
    const formatted = {
      id: row.id,
      clinicId: row.clinic_id,
      prescriptionNumber: row.prescription_number,
      patientId: row.patient_id,
      patient: {
        id: row.patient_id,
        firstName: row.patient_first_name,
        lastName: row.patient_last_name,
        dateOfBirth: row.patient_dob,
        gender: row.patient_gender,
        allergies: row.patient_allergies,
        medicalHistory: row.patient_medical_history,
      },
      appointmentId: row.appointment_id,
      appointment: row.appointment_id ? {
        id: row.appointment_id,
        date: row.appointment_date,
        treatmentType: row.treatment_type,
      } : null,
      dentistId: row.dentist_id,
      dentist: {
        id: row.dentist_id,
        name: row.dentist_name,
        email: row.dentist_email,
      },
      prescriptionDate: row.prescription_date,
      diagnosis: row.diagnosis,
      notes: row.notes,
      status: row.status,
      pharmacy: {
        name: row.pharmacy_name,
        phone: row.pharmacy_phone,
        address: row.pharmacy_address,
      },
      isControlledSubstance: row.is_controlled_substance,
      deaNumber: row.dea_number,
      dispensedDate: row.dispensed_date,
      dispensedBy: row.dispensed_by,
      items: items.map(item => ({
        id: item.id,
        medicationName: item.medication_name,
        genericName: item.generic_name,
        strength: item.strength,
        form: item.form,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        refills: item.refills,
        instructions: item.instructions,
        warnings: item.warnings,
        startDate: item.start_date,
        endDate: item.end_date,
        isPRN: item.is_prn,
      })),
      refills: refills.map(refill => ({
        id: refill.id,
        refillDate: refill.refill_date,
        quantity: refill.quantity,
        pharmacyName: refill.pharmacy_name,
        notes: refill.notes,
        createdBy: refill.created_by,
        createdByName: refill.created_by_name,
      })),
      totalRefillsRemaining: items.reduce((sum, item) => sum + (item.refills || 0), 0) - refills.length,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdByName: row.created_by_name,
      updatedByName: row.updated_by_name,
    };

    return formatted;
  }
}

module.exports = new PrescriptionService();