const pool = require('../db/pool');
const { NotFoundError, ValidationError, ConflictError } = require('../../utils/errors');

class AppointmentService {
  /**
   * Get all appointments with filters
   */
  async getAppointments(clinicId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      patientId,
      dentistId,
      status,
      fromDate,
      toDate,
      today = false,
      upcoming = false,
      sortBy = 'appointmentDate',
      sortOrder = 'ASC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let paramIndex = 2;

    let whereClause = 'WHERE a.clinic_id = $1';
    
    if (patientId) {
      whereClause += ` AND a.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
    }

    if (dentistId) {
      whereClause += ` AND a.dentist_id = $${paramIndex}`;
      params.push(dentistId);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (fromDate) {
      whereClause += ` AND a.appointment_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereClause += ` AND a.appointment_date <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    if (today) {
      whereClause += ` AND a.appointment_date = CURRENT_DATE`;
    }

    if (upcoming) {
      whereClause += ` AND a.appointment_date >= CURRENT_DATE`;
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM appointments a ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Build sort
    const sortColumn = {
      appointmentDate: 'a.appointment_date',
      startTime: 'a.start_time',
      status: 'a.status',
      createdAt: 'a.created_at',
    }[sortBy] || 'a.appointment_date';

    // Get data with joins
    const dataResult = await pool.query(
      `SELECT 
        a.id, a.clinic_id, a.patient_id, a.dentist_id, a.treatment_id,
        a.appointment_date, a.start_time, a.end_time,
        a.treatment_type, a.status, a.notes, a.chief_complaint,
        a.is_emergency, a.reminder_sent, a.confirmation_sent,
        a.created_at, a.updated_at, a.created_by, a.updated_by,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        p.phone as patient_phone, p.email as patient_email,
        u.full_name as dentist_name,
        t.name as treatment_name, t.duration_minutes as treatment_duration
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.dentist_id = u.id
      LEFT JOIN treatments t ON a.treatment_id = t.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}, a.start_time ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      appointments: dataResult.rows.map(this.formatAppointment),
      pagination: { page, limit, total },
    };
  }

  /**
   * Get single appointment
   */
  async getAppointmentById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        a.id, a.clinic_id, a.patient_id, a.dentist_id, a.treatment_id,
        a.appointment_date, a.start_time, a.end_time,
        a.treatment_type, a.status, a.notes, a.chief_complaint,
        a.is_emergency, a.reminder_sent, a.confirmation_sent,
        a.created_at, a.updated_at, a.created_by, a.updated_by,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        p.phone as patient_phone, p.email as patient_email,
        p.date_of_birth as patient_dob, p.gender as patient_gender,
        u.full_name as dentist_name, u.email as dentist_email,
        t.name as treatment_name, t.description as treatment_description,
        t.duration_minutes as treatment_duration, t.price as treatment_price,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.dentist_id = u.id
      LEFT JOIN treatments t ON a.treatment_id = t.id
      LEFT JOIN users creator ON a.created_by = creator.id
      LEFT JOIN users updater ON a.updated_by = updater.id
      WHERE a.id = $1 AND a.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) {
      throw new NotFoundError('Appointment');
    }

    return this.formatAppointment(rows[0]);
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflict(dentistId, appointmentDate, startTime, endTime, excludeAppointmentId = null, clinicId) {
    let query = `
      SELECT COUNT(*) as conflict_count
      FROM appointments
      WHERE dentist_id = $1 
        AND appointment_date = $2 
        AND status NOT IN ('cancelled', 'no_show', 'completed')
        AND (
          (start_time <= $3 AND end_time > $3) OR
          (start_time < $4 AND end_time >= $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
    `;
    
    const params = [dentistId, appointmentDate, startTime, endTime];
    let paramIndex = 5;

    if (excludeAppointmentId) {
      query += ` AND id != $${paramIndex}`;
      params.push(excludeAppointmentId);
      paramIndex++;
    }

    if (clinicId) {
      query += ` AND clinic_id = $${paramIndex}`;
      params.push(clinicId);
    }

    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].conflict_count) > 0;
  }

  /**
   * Create appointment
   */
  async createAppointment(data, userId, clinicId) {
    // Check for scheduling conflict
    const hasConflict = await this.checkConflict(
      data.dentistId,
      data.appointmentDate,
      data.startTime,
      data.endTime,
      null,
      clinicId
    );

    if (hasConflict) {
      throw new ConflictError('Time slot is already booked for this dentist');
    }

    const { rows } = await pool.query(
      `INSERT INTO appointments (
        clinic_id, patient_id, dentist_id, treatment_id,
        appointment_date, start_time, end_time,
        treatment_type, status, notes, chief_complaint,
        is_emergency, reminder_sent, confirmation_sent,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        clinicId,
        data.patientId,
        data.dentistId,
        data.treatmentId || null,
        data.appointmentDate,
        data.startTime,
        data.endTime,
        data.treatmentType,
        data.status || 'scheduled',
        data.notes || null,
        data.chiefComplaint || null,
        data.isEmergency || false,
        data.reminderSent || false,
        data.confirmationSent || false,
        userId,
        userId,
      ]
    );

    return await this.getAppointmentById(rows[0].id, clinicId);
  }

  /**
   * Update appointment
   */
  async updateAppointment(id, data, userId, clinicId) {
    // Check if appointment exists
    const existing = await this.getAppointmentById(id, clinicId);

    // Check for conflict if time/dentist changed
    if (data.dentistId || data.appointmentDate || data.startTime || data.endTime) {
      const hasConflict = await this.checkConflict(
        data.dentistId || existing.dentistId,
        data.appointmentDate || existing.appointmentDate,
        data.startTime || existing.startTime,
        data.endTime || existing.endTime,
        id,
        clinicId
      );

      if (hasConflict) {
        throw new ConflictError('Time slot is already booked for this dentist');
      }
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      patientId: 'patient_id',
      dentistId: 'dentist_id',
      treatmentId: 'treatment_id',
      appointmentDate: 'appointment_date',
      startTime: 'start_time',
      endTime: 'end_time',
      treatmentType: 'treatment_type',
      status: 'status',
      notes: 'notes',
      chiefComplaint: 'chief_complaint',
      isEmergency: 'is_emergency',
      reminderSent: 'reminder_sent',
      confirmationSent: 'confirmation_sent',
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
      `UPDATE appointments 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND clinic_id = $${paramIndex + 1}`,
      params
    );

    return await this.getAppointmentById(id, clinicId);
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id, reason, userId, clinicId) {
    await this.getAppointmentById(id, clinicId);

    await pool.query(
      `UPDATE appointments 
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
   * Get today's appointments
   */
  async getTodayAppointments(clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        a.id, a.appointment_date, a.start_time, a.end_time,
        a.treatment_type, a.status, a.is_emergency,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        u.full_name as dentist_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.dentist_id = u.id
      WHERE a.clinic_id = $1 
        AND a.appointment_date = CURRENT_DATE
        AND a.status NOT IN ('cancelled', 'no_show')
      ORDER BY a.start_time ASC`,
      [clinicId]
    );

    return rows.map(this.formatAppointment);
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(clinicId, fromDate, toDate) {
    const params = [clinicId];
    let dateFilter = '';
    let paramIndex = 2;

    if (fromDate) {
      dateFilter += ` AND appointment_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      dateFilter += ` AND appointment_date <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as checked_in,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show,
        COUNT(CASE WHEN is_emergency = true THEN 1 END) as emergencies
      FROM appointments
      WHERE clinic_id = $1 ${dateFilter}`,
      params
    );

    return rows[0];
  }

  /**
   * Format appointment for response
   */
  formatAppointment(row) {
    return {
      id: row.id,
      clinicId: row.clinic_id,
      patientId: row.patient_id,
      dentistId: row.dentist_id,
      treatmentId: row.treatment_id,
      appointmentDate: row.appointment_date,
      startTime: row.start_time,
      endTime: row.end_time,
      treatmentType: row.treatment_type,
      status: row.status,
      notes: row.notes,
      chiefComplaint: row.chief_complaint,
      isEmergency: row.is_emergency,
      reminderSent: row.reminder_sent,
      confirmationSent: row.confirmation_sent,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      // Patient info
      patient: {
        id: row.patient_id,
        firstName: row.patient_first_name,
        lastName: row.patient_last_name,
        phone: row.patient_phone,
        email: row.patient_email,
        dateOfBirth: row.patient_dob,
        gender: row.patient_gender,
      },
      // Dentist info
      dentist: {
        id: row.dentist_id,
        name: row.dentist_name,
        email: row.dentist_email,
      },
      // Treatment info
      treatment: row.treatment_id ? {
        id: row.treatment_id,
        name: row.treatment_name,
        description: row.treatment_description,
        duration: row.treatment_duration,
        price: row.treatment_price,
      } : null,
      createdByName: row.created_by_name,
      updatedByName: row.updated_by_name,
    };
  }
}

module.exports = new AppointmentService();