const pool = require('../db/pool');
const fs = require('fs');
const path = require('path');
const { NotFoundError } = require('../../utils/errors');
const { exec } = require('child_process');

class BackupService {
  async createBackup(userId, clinicId) {
    const fileName = `backup_${clinicId}_${Date.now()}.sql`;
    const filePath = path.join(__dirname, '../../backups', fileName);

    // create DB dump (PostgreSQL example)
    const command = `pg_dump -U postgres -F c -b -v -f ${filePath} your_database_name`;

    exec(command);

    const { rows } = await pool.query(
      `INSERT INTO backups (clinic_id, file_name, file_path, status, created_by)
       VALUES ($1,$2,$3,'pending',$4)
       RETURNING *`,
      [clinicId, fileName, filePath, userId]
    );

    return rows[0];
  }

  async getBackups(clinicId, filters) {
    const { page, limit, status } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (status) {
      where += ` AND status = $${i++}`;
      params.push(status);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM backups ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT * FROM backups
       ${where}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      backups: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async restoreBackup(id, userId, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM backups WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Backup');

    const backup = rows[0];

    const command = `pg_restore -U postgres -d your_database_name ${backup.file_path}`;

    exec(command);

    return { status: 'restore_started' };
  }

  async deleteBackup(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM backups WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Backup');

    const backup = rows[0];

    try {
      fs.unlinkSync(backup.file_path);
    } catch (e) {}

    await pool.query(
      `DELETE FROM backups WHERE id = $1`,
      [id]
    );

    return { success: true };
  }
}

module.exports = new BackupService();