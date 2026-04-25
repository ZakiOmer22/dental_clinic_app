const pool = require('../db/pool');

class SettingsService {
  async getSettings(clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM clinic_settings WHERE clinic_id = $1`,
      [clinicId]
    );

    if (!rows.length) {
      // return default settings if not exists
      return {
        clinicId,
        slotDuration: 30,
        maxAppointmentsPerDay: 20,
        currency: 'USD',
        workingHours: {
          start: '08:00',
          end: '18:00',
        },
        notificationsEnabled: true,
      };
    }

    return rows[0];
  }

  async updateSettings(clinicId, data, userId) {
    const existing = await this.getSettings(clinicId);

    const { rows } = await pool.query(
      `INSERT INTO clinic_settings (
        clinic_id,
        slot_duration,
        max_appointments_per_day,
        currency,
        working_hours,
        notifications_enabled,
        updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (clinic_id)
      DO UPDATE SET
        slot_duration = EXCLUDED.slot_duration,
        max_appointments_per_day = EXCLUDED.max_appointments_per_day,
        currency = EXCLUDED.currency,
        working_hours = EXCLUDED.working_hours,
        notifications_enabled = EXCLUDED.notifications_enabled,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *`,
      [
        clinicId,
        data.slotDuration,
        data.maxAppointmentsPerDay,
        data.currency,
        JSON.stringify(data.workingHours),
        data.notificationsEnabled,
        userId,
      ]
    );

    return rows[0];
  }
}

module.exports = new SettingsService();