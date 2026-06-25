const { query, get } = require('./db');

class FavoriteModel {
  static async getFavoritesBySessionId(sessionId) {
    const sql = `
      SELECT 
        f.id as favorite_id,
        f.session_id,
        d."DeviceID" AS id,
        d."DeviceName" AS name,
        dv."DepositAmount" AS price,
        dv."DailyRentalPrice" AS trial_price_per_day,
        d."Image" AS image_url,
        dv."Quantity" AS stock_quantity,
        d."CategoryId" AS category_id
      FROM "favorites" f
      JOIN "Device_Variant" dv ON f.variant_id = dv."VariantID"
      JOIN "Device" d ON dv."DeviceID" = d."DeviceID"
      WHERE f.session_id = ?
      ORDER BY f.added_at DESC
    `;
    const rows = await query(sql, [sessionId]);
    return rows.map(r => ({
      ...r,
      price: parseFloat(r.price) || 0,
      trial_price_per_day: parseFloat(r.trial_price_per_day) || 0
    }));
  }

  static async isFavorited(sessionId, variantId) {
    const sql = `SELECT id FROM "favorites" WHERE session_id = ? AND variant_id = ?`;
    const row = await get(sql, [sessionId, variantId]);
    return !!row;
  }

  static async isProductFavorited(sessionId, productId) {
    const sql = `
      SELECT f.id FROM "favorites" f
      JOIN "Device_Variant" dv ON f.variant_id = dv."VariantID"
      WHERE f.session_id = ? AND dv."DeviceID" = ?
      LIMIT 1
    `;
    const row = await get(sql, [sessionId, productId]);
    return !!row;
  }

  static async toggleFavorite(sessionId, productId, variantId = null) {
    let targetVariantId = variantId;

    if (!targetVariantId && productId) {
      const defaultVar = await get('SELECT "VariantID" FROM "Device_Variant" WHERE "DeviceID" = ? LIMIT 1', [productId]);
      if (defaultVar) {
        targetVariantId = defaultVar.VariantID;
      }
    }

    if (!targetVariantId) {
      return { favorited: false };
    }

    const exists = await this.isFavorited(sessionId, targetVariantId);
    if (exists) {
      const sql = `DELETE FROM "favorites" WHERE session_id = ? AND variant_id = ?`;
      await query(sql, [sessionId, targetVariantId]);
      return { favorited: false };
    } else {
      const sql = `INSERT INTO "favorites" (session_id, variant_id) VALUES (?, ?)`;
      await query(sql, [sessionId, targetVariantId]);
      return { favorited: true };
    }
  }
}

module.exports = FavoriteModel;
