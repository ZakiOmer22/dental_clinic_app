const pool = require('../db/pool');
const { NotFoundError } = require('../../utils/errors');

class KnowledgeBaseService {
  async getArticles(clinicId, filters) {
    const { page, limit, category, search, isPublished } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE kb.clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (category) {
      where += ` AND kb.category = $${i++}`;
      params.push(category);
    }

    if (isPublished !== undefined) {
      where += ` AND kb.is_published = $${i++}`;
      params.push(isPublished === 'true');
    }

    if (search) {
      where += ` AND kb.title ILIKE $${i++}`;
      params.push(`%${search}%`);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM knowledge_base kb ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT kb.*,
              u.full_name as author_name
       FROM knowledge_base kb
       LEFT JOIN users u ON kb.created_by = u.id
       ${where}
       ORDER BY kb.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      articles: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getArticleById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM knowledge_base
       WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Article');

    return rows[0];
  }

  async createArticle(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO knowledge_base
       (clinic_id, title, content, category, is_published, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        clinicId,
        data.title,
        data.content,
        data.category,
        data.isPublished || false,
        userId,
      ]
    );

    return rows[0];
  }

  async updateArticle(id, data, userId, clinicId) {
    await this.getArticleById(id, clinicId);

    const { rows } = await pool.query(
      `UPDATE knowledge_base
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           category = COALESCE($3, category),
           is_published = COALESCE($4, is_published),
           updated_at = NOW()
       WHERE id = $5 AND clinic_id = $6
       RETURNING *`,
      [
        data.title,
        data.content,
        data.category,
        data.isPublished,
        id,
        clinicId,
      ]
    );

    return rows[0];
  }

  async deleteArticle(id, clinicId) {
    const { rows } = await pool.query(
      `DELETE FROM knowledge_base
       WHERE id = $1 AND clinic_id = $2
       RETURNING id`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Article');

    return { success: true };
  }
}

module.exports = new KnowledgeBaseService();