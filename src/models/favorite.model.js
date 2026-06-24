const { query, get } = require('./db');

class FavoriteModel {
  static async getFavoritesBySessionId(sessionId) {
    const sql = `
      SELECT 
        f.id as favorite_id,
        f.session_id,
        p.*
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.session_id = ?
      ORDER BY f.added_at DESC
    `;
    return await query(sql, [sessionId]);
  }

  static async isFavorited(sessionId, productId) {
    const sql = `SELECT id FROM favorites WHERE session_id = ? AND product_id = ?`;
    const row = await get(sql, [sessionId, productId]);
    return !!row;
  }

  static async toggleFavorite(sessionId, productId) {
    const exists = await this.isFavorited(sessionId, productId);
    if (exists) {
      const sql = `DELETE FROM favorites WHERE session_id = ? AND product_id = ?`;
      await query(sql, [sessionId, productId]);
      return { favorited: false };
    } else {
      const sql = `INSERT INTO favorites (session_id, product_id) VALUES (?, ?)`;
      await query(sql, [sessionId, productId]);
      return { favorited: true };
    }
  }
}

module.exports = FavoriteModel;
