const pool = require('../db/pool');
const fs = require('fs');
const path = require('path');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class FileService {
  async uploadFile(file, data, userId, clinicId) {
    if (!file) throw new ValidationError('File is required');

    const { rows } = await pool.query(
      `INSERT INTO files
       (clinic_id, entity_type, entity_id, file_path, original_name, mime_type, size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        clinicId,
        data.entityType,
        data.entityId || null,
        file.path,
        file.originalname,
        file.mimetype,
        file.size,
        userId,
      ]
    );

    return rows[0];
  }

  async getFiles(clinicId, filters) {
    const { page, limit, entityType, entityId } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (entityType) {
      where += ` AND entity_type = $${i++}`;
      params.push(entityType);
    }

    if (entityId) {
      where += ` AND entity_id = $${i++}`;
      params.push(entityId);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM files ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT * FROM files
       ${where}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      files: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async deleteFile(id, userId, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM files WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('File');

    const file = rows[0];

    // delete from disk
    try {
      fs.unlinkSync(path.resolve(file.file_path));
    } catch (err) {
      // ignore missing file
    }

    await pool.query(
      `DELETE FROM files WHERE id = $1`,
      [id]
    );

    return { success: true };
  }
}

module.exports = new FileService();