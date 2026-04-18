const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class PatientService {
  /**
   * Get all patients for a clinic with pagination and filters
   */
  async getPatients(clinicId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let paramIndex = 2;

    let whereClause = 'WHERE p.clinic_id = $1';
    
    if (search) {
      whereClause += ` AND (
        p.first_name ILIKE $${paramIndex} OR 
        p.last_name ILIKE $${paramIndex} OR 
        p.email ILIKE $${paramIndex} OR
        p.phone ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereClause += ` AND p.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM patients p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get data
    const sortColumn = sortBy === 'firstName' ? 'p.first_name' : 
                       sortBy === 'lastName' ? 'p.last_name' : 
                       sortBy === 'createdAt' ? 'p.created_at' : 'p.updated_at';

    const dataResult = await pool.query(
      `SELECT 
        p.id, p.clinic_id, p.first_name, p.last_name, p.email, 
        p.phone, p.mobile, p.date_of_birth, p.gender,
        p.address, p.city, p.state, p.zip_code,
        p.emergency_contact_name, p.emergency_contact_phone,
        p.medical_history, p.allergies, p.notes,
        p.insurance_provider, p.insurance_policy_number,
        p.is_active, p.created_at, p.updated_at,
        p.created_by, p.updated_by,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM patients p
      LEFT JOIN users creator ON p.created_by = creator.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      patients: dataResult.rows.map(this.formatPatient),
      pagination: { page, limit, total },
    };
  }

  /**
   * Get single patient by ID
   */
  async getPatientById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        p.id, p.clinic_id, p.first_name, p.last_name, p.email, 
        p.phone, p.mobile, p.date_of_birth, p.gender,
        p.address, p.city, p.state, p.zip_code,
        p.emergency_contact_name, p.emergency_contact_phone,
        p.medical_history, p.allergies, p.notes,
        p.insurance_provider, p.insurance_policy_number,
        p.is_active, p.created_at, p.updated_at,
        p.created_by, p.updated_by,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM patients p
      LEFT JOIN users creator ON p.created_by = creator.id
      WHERE p.id = $1 AND p.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) {
      throw new NotFoundError('Patient');
    }

    return this.formatPatient(rows[0]);
  }

  /**
   * Create new patient
   */
  async createPatient(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO patients (
        clinic_id, first_name, last_name, email, phone, mobile,
        date_of_birth, gender, address, city, state, zip_code,
        emergency_contact_name, emergency_contact_phone,
        medical_history, allergies, notes,
        insurance_provider, insurance_policy_number,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        clinicId,
        data.firstName,
        data.lastName,
        data.email || null,
        data.phone || null,
        data.mobile || null,
        data.dateOfBirth || null,
        data.gender || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.zipCode || null,
        data.emergencyContactName || null,
        data.emergencyContactPhone || null,
        data.medicalHistory || null,
        data.allergies || null,
        data.notes || null,
        data.insuranceProvider || null,
        data.insurancePolicyNumber || null,
        userId,
        userId,
      ]
    );

    return this.formatPatient(rows[0]);
  }

  /**
   * Update patient
   */
  async updatePatient(id, data, userId, clinicId) {
    // Check if patient exists and belongs to clinic
    await this.getPatientById(id, clinicId);

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      mobile: 'mobile',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      address: 'address',
      city: 'city',
      state: 'state',
      zipCode: 'zip_code',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
      medicalHistory: 'medical_history',
      allergies: 'allergies',
      notes: 'notes',
      insuranceProvider: 'insurance_provider',
      insurancePolicyNumber: 'insurance_policy_number',
      isActive: 'is_active',
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

    const { rows } = await pool.query(
      `UPDATE patients 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND clinic_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    return this.formatPatient(rows[0]);
  }

  /**
   * Delete patient (soft delete)
   */
  async deletePatient(id, clinicId) {
    await this.getPatientById(id, clinicId);

    await pool.query(
      `UPDATE patients SET is_active = false, updated_at = NOW() 
       WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    return { success: true };
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_patients,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_count
      FROM patients
      WHERE clinic_id = $1`,
      [clinicId]
    );

    return rows[0];
  }

  /**
   * Format patient object for response
   */
  formatPatient(row) {
    return {
      id: row.id,
      clinicId: row.clinic_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      medicalHistory: row.medical_history,
      allergies: row.allergies,
      notes: row.notes,
      insuranceProvider: row.insurance_provider,
      insurancePolicyNumber: row.insurance_policy_number,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdByName: row.created_by_name,
      updatedByName: row.updated_by_name,
    };
  }
}

module.exports = new PatientService();