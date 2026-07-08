const { query, get } = require('./db');

class FavoriteModel {
  static async getFavoritesBySessionId(sessionId, customerId = null) {
    const whereClause = customerId ? 'f.customer_id = ?' : 'f.session_id = ?';
    const paramVal = customerId ? customerId : sessionId;

    const sql = `
      SELECT 
        f.favorite_id,
        f.session_id,
        d.device_id AS id,
        d.device_name AS name,
        (dv.daily_rental_price * 10) AS price,
        dv.daily_rental_price AS trial_price_per_day,
        d.default_image AS image_url,
        COALESCE((SELECT COUNT(*) FROM device_units du WHERE du.variant_id = dv.variant_id AND du.current_status = 'available'), 0) AS stock_quantity,
        d.category_id AS category_id
      FROM favorites f
      JOIN device_variants dv ON f.variant_id = dv.variant_id
      JOIN devices d ON dv.device_id = d.device_id
      WHERE ${whereClause}
      ORDER BY f.created_at DESC
    `;
    const rows = await query(sql, [paramVal]);
    return rows.map(r => ({
      ...r,
      price: parseFloat(r.price) || 0,
      trial_price_per_day: parseFloat(r.trial_price_per_day) || 0
    }));
  }

  static async isFavorited(sessionId, customerId, variantId) {
    const sql = customerId
      ? `SELECT favorite_id FROM favorites WHERE customer_id = ? AND variant_id = ?`
      : `SELECT favorite_id FROM favorites WHERE session_id = ? AND variant_id = ?`;
    const params = customerId ? [customerId, variantId] : [sessionId, variantId];
    const row = await get(sql, params);
    return !!row;
  }

  static async isProductFavorited(sessionId, customerId, productId) {
    const sql = customerId
      ? `
        SELECT f.favorite_id FROM favorites f
        JOIN device_variants dv ON f.variant_id = dv.variant_id
        WHERE f.customer_id = ? AND dv.device_id = ?
        LIMIT 1
      `
      : `
        SELECT f.favorite_id FROM favorites f
        JOIN device_variants dv ON f.variant_id = dv.variant_id
        WHERE f.session_id = ? AND dv.device_id = ?
        LIMIT 1
      `;
    const params = customerId ? [customerId, productId] : [sessionId, productId];
    const row = await get(sql, params);
    return !!row;
  }

  static async toggleFavorite(sessionId, customerId, productId, variantId = null) {
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

    const exists = await this.isFavorited(sessionId, customerId, targetVariantId);
    if (exists) {
      const sql = customerId
        ? `DELETE FROM favorites WHERE customer_id = ? AND variant_id = ?`
        : `DELETE FROM favorites WHERE session_id = ? AND variant_id = ?`;
      const params = customerId ? [customerId, targetVariantId] : [sessionId, targetVariantId];
      await query(sql, params);
      return { favorited: false };
    } else {
      const sql = `INSERT INTO favorites (session_id, customer_id, variant_id) VALUES (?, ?, ?)`;
      await query(sql, [sessionId, customerId, targetVariantId]);
      return { favorited: true };
    }
  }
}

module.exports = FavoriteModel;
