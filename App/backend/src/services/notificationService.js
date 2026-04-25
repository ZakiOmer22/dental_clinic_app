const pool = require('../db/pool');
const { NotFoundError } = require('../../utils/errors');

class NotificationService {
  
  async getNotifications(userId, filters) {
    const { page, limit, isRead, type } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE user_id = $1';
    const params = [userId];
    let i = 2;

    if (isRead !== undefined) {
      where += ` AND is_read = $${i++}`;
      params.push(isRead === 'true');
    }

    if (type) {
      where += ` AND type = $${i++}`;
      params.push(type);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM notifications ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT * FROM notifications
       ${where}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      notifications: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async markAsRead(id, userId) {
    const { rows } = await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (!rows.length) throw new NotFoundError('Notification');

    return rows[0];
  }

  async markAllAsRead(userId) {
    await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return { success: true };
  }

  async createNotification(data) {
    const { rows } = await pool.query(
      `INSERT INTO notifications
       (user_id, clinic_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.userId,
        data.clinicId,
        data.type,
        data.title,
        data.message,
        data.metadata || null,
      ]
    );

    return rows[0];
  }
}

module.exports = new NotificationService();