const { query, get } = require('./db');

class CartModel {
  static async getCartBySessionId(sessionId) {
    const sql = `
      SELECT 
        ci.id as cart_item_id,
        ci.session_id,
        ci.type,
        ci.quantity,
        ci.product_id,
        ci.combo_id,
        p.name as product_name,
        p.price as product_price,
        p.trial_price_per_day as product_trial_price,
        p.image_url as product_image_url,
        c.name as combo_name,
        c.price as combo_price,
        c.image_url as combo_image_url
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN combos c ON ci.combo_id = c.id
      WHERE ci.session_id = ?
      ORDER BY ci.added_at DESC
    `;
    const items = await query(sql, [sessionId]);
    
    // Format the items to match the expected client structure
    return items.map(item => {
      let price = 0;
      let name = '';
      let image = '';
      let typeName = '';

      if (item.type === 'trial' && item.product_id) {
        price = item.product_trial_price;
        name = `${item.product_name} (Dùng thử 1 ngày)`;
        image = item.product_image_url;
        typeName = 'Dùng thử';
      } else if (item.type === 'buy' && item.product_id) {
        price = item.product_price;
        name = item.product_name;
        image = item.product_image_url;
        typeName = 'Mua đứt';
      } else if (item.type === 'combo' && item.combo_id) {
        price = item.combo_price;
        name = item.combo_name;
        image = item.combo_image_url;
        typeName = 'Gói Combo';
      }

      return {
        cart_item_id: item.cart_item_id,
        uniqueId: item.cart_item_id, // alias for frontend
        id: item.product_id || item.combo_id,
        name,
        price,
        image,
        type: typeName,
        quantity: item.quantity
      };
    });
  }

  static async addItem(sessionId, productId, comboId, type) {
    // Check if it already exists to increment quantity
    const existing = await get(
      `SELECT id, quantity FROM cart_items WHERE session_id = ? AND IFNULL(product_id, 0) = ? AND IFNULL(combo_id, 0) = ? AND type = ?`,
      [sessionId, productId || 0, comboId || 0, type]
    );

    if (existing) {
      const sql = `UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?`;
      await query(sql, [existing.id]);
      return existing.id;
    } else {
      const sql = `
        INSERT INTO cart_items (session_id, product_id, combo_id, type)
        VALUES (?, ?, ?, ?)
      `;
      const result = await query(sql, [sessionId, productId, comboId, type]);
      // Note: we can't easily return insertId from our custom query wrapper without changing it,
      // but we don't strictly need it if we just refetch.
      return true;
    }
  }

  static async removeItem(sessionId, cartItemId) {
    const sql = `DELETE FROM cart_items WHERE session_id = ? AND id = ?`;
    return await query(sql, [sessionId, cartItemId]);
  }

  static async clearCart(sessionId) {
    const sql = `DELETE FROM cart_items WHERE session_id = ?`;
    return await query(sql, [sessionId]);
  }
}

module.exports = CartModel;
