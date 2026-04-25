const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class PatientService {
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
        p.full_name ILIKE $${paramIndex} OR 
        p.email ILIKE $${paramIndex} OR
        p.phone ILIKE $${paramIndex} OR
        p.secondary_phone ILIKE $${paramIndex} OR
        p.national_id ILIKE $${paramIndex} OR
        p.patient_number ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereClause += ` AND p.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM patients p ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);

    const sortColumn =
      sortBy === 'firstName' ? 'p.full_name' :
      sortBy === 'lastName' ? 'p.full_name' :
      sortBy === 'createdAt' ? 'p.created_at' : 'p.updated_at';

    const dataResult = await pool.query(
      `SELECT 
        p.id, p.clinic_id, p.patient_number,
        p.full_name,
        SPLIT_PART(p.full_name, ' ', 1) as first_name,
        CASE WHEN SPLIT_PART(p.full_name, ' ', 2) != '' 
             THEN SPLIT_PART(p.full_name, ' ', 2) 
             ELSE '' END as last_name,
        p.email, 
        p.phone, 
        p.secondary_phone as mobile,
        p.date_of_birth, p.gender, p.blood_type,
        p.national_id, p.address, p.city,
        p.occupation, p.marital_status,
        p.referred_by, p.notes,
        p.is_active, p.created_at, p.updated_at,
        p.created_by, p.updated_by,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM patients p
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN users updater ON p.updated_by = updater.id
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

  async getPatientById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        p.id, p.clinic_id, p.patient_number,
        p.full_name,
        SPLIT_PART(p.full_name, ' ', 1) as first_name,
        CASE WHEN SPLIT_PART(p.full_name, ' ', 2) != '' 
             THEN SPLIT_PART(p.full_name, ' ', 2) 
             ELSE '' END as last_name,
        p.email, 
        p.phone, 
        p.secondary_phone as mobile,
        p.date_of_birth, p.gender, p.blood_type,
        p.national_id, p.address, p.city,
        p.occupation, p.marital_status,
        p.referred_by, p.notes,
        p.is_active, p.created_at, p.updated_at,
        p.created_by, p.updated_by,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM patients p
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN users updater ON p.updated_by = updater.id
      WHERE p.id = $1 AND p.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Patient');

    return this.formatPatient(rows[0]);
  }

  async createPatient(data, userId, clinicId) {
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();

    const { rows } = await pool.query(
      `INSERT INTO patients (
        clinic_id, patient_number, full_name, email, phone, secondary_phone,
        date_of_birth, gender, blood_type, national_id,
        address, city, occupation, marital_status,
        referred_by, notes, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [
        clinicId,
        data.patientNumber || null,
        fullName || null,
        data.email || null,
        data.phone || null,
        data.mobile || null,
        data.dateOfBirth || null,
        data.gender || null,
        data.bloodType || null,
        data.nationalId || null,
        data.address || null,
        data.city || null,
        data.occupation || null,
        data.maritalStatus || null,
        data.referredBy || null,
        data.notes || null,
        userId,
        userId,
      ]
    );

    return this.formatPatient(rows[0]);
  }

  async updatePatient(id, data, userId, clinicId) {
    await this.getPatientById(id, clinicId);

    const updates = [];
    const params = [];
    let paramIndex = 1;

    // Handle firstName + lastName => full_name combination
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const existing = await pool.query(
        'SELECT full_name FROM patients WHERE id = $1',
        [id]
      );
      const currentName = existing.rows[0]?.full_name || '';
      const firstName = data.firstName !== undefined 
        ? data.firstName 
        : currentName.split(' ')[0] || '';
      const lastName = data.lastName !== undefined 
        ? data.lastName 
        : currentName.split(' ').slice(1).join(' ') || '';
      
      updates.push(`full_name = $${paramIndex}`);
      params.push(`${firstName} ${lastName}`.trim());
      paramIndex++;
    }

    const fieldMap = {
      patientNumber: 'patient_number',
      email: 'email',
      phone: 'phone',
      mobile: 'secondary_phone',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      bloodType: 'blood_type',
      nationalId: 'national_id',
      address: 'address',
      city: 'city',
      occupation: 'occupation',
      maritalStatus: 'marital_status',
      referredBy: 'referred_by',
      notes: 'notes',
      isActive: 'is_active',
    };

    Object.entries(fieldMap).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(data[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return await this.getPatientById(id, clinicId);
    }

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

  async deletePatient(id, clinicId) {
    await this.getPatientById(id, clinicId);

    await pool.query(
      `UPDATE patients SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    return { success: true };
  }

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

  formatPatient(row) {
  return {
    // Keep ALL original snake_case fields that frontend uses
    id: row.id,
    clinic_id: row.clinic_id,
    patient_number: row.patient_number,
    full_name: row.full_name,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    secondary_phone: row.mobile,
    date_of_birth: row.date_of_birth,
    gender: row.gender,
    blood_type: row.blood_type,
    national_id: row.national_id,
    address: row.address,
    city: row.city,
    occupation: row.occupation,
    marital_status: row.marital_status,
    referred_by: row.referred_by,
    notes: row.notes,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_by_name: row.created_by_name,
    updated_by_name: row.updated_by_name,
  };
}
}

module.exports = new PatientService();