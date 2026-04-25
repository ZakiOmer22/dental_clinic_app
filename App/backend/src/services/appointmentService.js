const pool = require('../db/pool');
const { NotFoundError, ConflictError } = require('../../utils/errors');

class AppointmentService {

  async getAppointments(clinicId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      patientId,
      dentistId,
      doctorId,
      status,
      fromDate,
      toDate,
      today = false,
      upcoming = false,
      sortBy = 'scheduledAt',
      sortOrder = 'ASC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let i = 2;

    let where = `WHERE a.clinic_id = $1`;

    if (patientId) {
      where += ` AND a.patient_id = $${i++}`;
      params.push(patientId);
    }

    if (dentistId || doctorId) {
      where += ` AND a.doctor_id = $${i++}`;
      params.push(dentistId || doctorId);
    }

    if (status) {
      where += ` AND a.status = $${i++}`;
      params.push(status);
    }

    if (fromDate) {
      where += ` AND a.scheduled_at >= $${i++}`;
      params.push(fromDate);
    }

    if (toDate) {
      where += ` AND a.scheduled_at <= $${i++}`;
      params.push(toDate);
    }

    if (today) where += ` AND DATE(a.scheduled_at) = CURRENT_DATE`;
    if (upcoming) where += ` AND a.scheduled_at >= NOW()`;

    const count = await pool.query(
      `SELECT COUNT(*) FROM appointments a ${where}`,
      params
    );

    const total = parseInt(count.rows[0].count);

    const sortMap = {
      scheduledAt: 'a.scheduled_at',
      status: 'a.status',
      createdAt: 'a.created_at',
      duration: 'a.duration_minutes',
    };

    const sortColumn = sortMap[sortBy] || 'a.scheduled_at';

    const data = await pool.query(
      `
      SELECT 
        a.*,
        p.full_name as patient_name,
        p.phone as patient_phone,
        u.full_name as dentist_name
      FROM appointments a
      LEFT JOIN patients p ON p.id = a.patient_id
      LEFT JOIN users u ON u.id = a.doctor_id
      ${where}
      ORDER BY ${sortColumn} ${sortOrder} NULLS LAST
      LIMIT $${i++} OFFSET $${i++}
      `,
      [...params, limit, offset]
    );

    return {
      appointments: data.rows.map(r => this.format(r)),
      pagination: { page, limit, total }
    };
  }

  async checkConflict(doctorId, scheduledAt, endAt, excludeId, clinicId) {
    let q = `
      SELECT COUNT(*) FROM appointments
      WHERE doctor_id = $1
      AND clinic_id = $2
      AND status NOT IN ('cancelled','completed')
      AND (
        (scheduled_at <= $3 AND end_at > $3) OR
        (scheduled_at < $4 AND end_at >= $4) OR
        (scheduled_at >= $3 AND end_at <= $4)
      )
    `;

    const params = [doctorId, clinicId, scheduledAt, endAt];

    if (excludeId) {
      q += ` AND id != $5`;
      params.push(excludeId);
    }

    const res = await pool.query(q, params);
    return parseInt(res.rows[0].count) > 0;
  }

  async createAppointment(data, userId, clinicId) {

    const conflict = await this.checkConflict(
      data.doctorId,
      data.scheduledAt,
      data.endAt,
      null,
      clinicId
    );

    if (conflict) throw new ConflictError('Time slot already booked');

    const result = await pool.query(
      `
      INSERT INTO appointments (
        clinic_id, patient_id, doctor_id, room_id,
        scheduled_at, end_at, duration_minutes,
        type, status, chief_complaint, notes,
        cancellation_reason, reminder_sent, created_by
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *
      `,
      [
        clinicId,
        data.patientId,
        data.doctorId,
        data.roomId || null,
        data.scheduledAt,
        data.endAt,
        data.durationMinutes || 30,
        data.type || 'checkup',
        data.status || 'scheduled',
        data.chiefComplaint || null,
        data.notes || null,
        null,
        data.reminderSent || false,
        userId
      ]
    );

    return this.format(result.rows[0]);
  }

  async updateAppointment(id, data, userId, clinicId) {
    await this.getById(id, clinicId);

    const map = {
      patientId: 'patient_id',
      doctorId: 'doctor_id',
      roomId: 'room_id',
      scheduledAt: 'scheduled_at',
      endAt: 'end_at',
      durationMinutes: 'duration_minutes',
      type: 'type',
      status: 'status',
      chiefComplaint: 'chief_complaint',
      notes: 'notes',
      cancellationReason: 'cancellation_reason',
      reminderSent: 'reminder_sent',
    };

    const set = [];
    const params = [];
    let i = 1;

    for (const [k, v] of Object.entries(map)) {
      if (data[k] !== undefined) {
        set.push(`${v} = $${i++}`);
        params.push(data[k]);
      }
    }

    set.push(`updated_at = NOW()`);

    params.push(id, clinicId);

    await pool.query(
      `UPDATE appointments
       SET ${set.join(', ')}
       WHERE id = $${i++} AND clinic_id = $${i}`,
      params
    );

    return this.getById(id, clinicId);
  }

  async cancelAppointment(id, reason, userId, clinicId) {
    await this.getById(id, clinicId);

    await pool.query(
      `
      UPDATE appointments
      SET status='cancelled',
          cancellation_reason=$1,
          updated_at=NOW()
      WHERE id=$2 AND clinic_id=$3
      `,
      [reason || 'No reason', id, clinicId]
    );

    return { success: true };
  }

  async getById(id, clinicId) {
    const res = await pool.query(
      `SELECT * FROM appointments WHERE id=$1 AND clinic_id=$2`,
      [id, clinicId]
    );

    if (!res.rows.length) throw new NotFoundError('Appointment');
    return this.format(res.rows[0]);
  }

  format(r) {
    return r;
  }
}

module.exports = new AppointmentService();