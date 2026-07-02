const { query, get } = require('./db');

class FavoriteModel {
  static async getFavoritesBySessionId(sessionId) {
    const sql = `
      SELECT 
        f.favorite_id,
        f.session_id,
        d.device_id AS id,
        d.device_name AS name,
        dv.deposit_amount AS price,
        dv.daily_rental_price AS trial_price_per_day,
        d.default_image AS image_url,
        COALESCE((SELECT COUNT(*) FROM device_units du WHERE du.variant_id = dv.variant_id AND du.current_status = 'available'), 0) AS stock_quantity,
        d.category_id AS category_id
      FROM favorites f
      JOIN device_variants dv ON f.variant_id = dv.variant_id
      JOIN devices d ON dv.device_id = d.device_id
      WHERE f.session_id = ?
      ORDER BY f.created_at DESC
    `;
    const rows = await query(sql, [sessionId]);
    return rows.map(r => ({
      ...r,
      price: parseFloat(r.price) || 0,
      trial_price_per_day: parseFloat(r.trial_price_per_day) || 0
    }));
  }

  static async isFavorited(sessionId, variantId) {
    const sql = `SELECT favorite_id FROM favorites WHERE session_id = ? AND variant_id = ?`;
    const row = await get(sql, [sessionId, variantId]);
    return !!row;
  }

  static async isProductFavorited(sessionId, productId) {
    const sql = `
      SELECT f.favorite_id FROM favorites f
      JOIN device_variants dv ON f.variant_id = dv.variant_id
      WHERE f.session_id = ? AND dv.device_id = ?
      LIMIT 1
    `;
    const row = await get(sql, [sessionId, productId]);
    return !!row;
  }

  static async toggleFavorite(sessionId, productId, variantId = null) {
    let targetVariantId = variantId;

    if (!targetVariantId && productId) {
      const defaultVar = await get('SELECT variant_id FROM device_variants WHERE device_id = ? LIMIT 1', [productId]);
      if (defaultVar) {
        targetVariantId = defaultVar.variant_id;
      }
    }

    if (!targetVariantId) {
      return { favorited: false };
    }

    const exists = await this.isFavorited(sessionId, targetVariantId);
    if (exists) {
      const sql = `DELETE FROM favorites WHERE session_id = ? AND variant_id = ?`;
      await query(sql, [sessionId, targetVariantId]);
      return { favorited: false };
    } else {
      const sql = `INSERT INTO favorites (session_id, variant_id) VALUES (?, ?)`;
      await query(sql, [sessionId, targetVariantId]);
      return { favorited: true };
    }
  }
}

module.exports = FavoriteModel;
