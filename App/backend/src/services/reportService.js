const pool = require('../db/pool');

class ReportService {
  /**
   * Appointment analytics
   */
  async getAppointmentReport(clinicId, fromDate, toDate) {
    const params = [clinicId];
    let dateFilter = '';
    let i = 2;

    if (fromDate) {
      dateFilter += ` AND appointment_date >= $${i++}`;
      params.push(fromDate);
    }

    if (toDate) {
      dateFilter += ` AND appointment_date <= $${i++}`;
      params.push(toDate);
    }

    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show
      FROM appointments
      WHERE clinic_id = $1 ${dateFilter}`,
      params
    );

    return rows[0];
  }

     /**
   * Revenue analytics
   */
  async getRevenueReport(clinicId, fromDate, toDate) {
    const params = [clinicId];
    let filter = '';
    let i = 2;

    if (fromDate) {
      filter += ` AND created_at >= $${i++}`;
      params.push(fromDate);
    }

    if (toDate) {
      filter += ` AND created_at <= $${i++}`;
      params.push(toDate + ' 23:59:59');
    }

    const { rows } = await pool.query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        COALESCE(SUM(total_amount), 0) as total_collected,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COUNT(*) as total_invoices
      FROM invoices
      WHERE clinic_id = $1 ${filter}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC`,
      params
    );

    return rows;
  }

  /**
   * Patient stats
   */
  async getPatientStats(clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_patients
      FROM patients
      WHERE clinic_id = $1`,
      [clinicId]
    );

    return rows[0];
  }

  /**
   * Treatment performance
   */
    async getTreatmentReport(clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        p.name,
        COUNT(t.id) as total_cases
      FROM procedures p
      LEFT JOIN treatments t ON p.id = t.procedure_id
      WHERE p.clinic_id = $1
      GROUP BY p.name
      ORDER BY total_cases DESC`,
      [clinicId]
    );
    return rows;
  }

  /**
   * Export (basic version)
   */
  async exportReport(type, clinicId, query) {
    switch (type) {
      case 'appointments':
        return this.getAppointmentReport(clinicId, query.fromDate, query.toDate);
      case 'revenue':
        return this.getRevenueReport(clinicId, query.fromDate, query.toDate);
      default:
        throw new Error('Invalid report type');
    }
  }
}

module.exports = new ReportService();