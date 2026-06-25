const { query, get } = require('./db');

class CartModel {
  static async getCartBySessionId(sessionId) {
    const sql = `
      SELECT 
        ci.id as cart_item_id,
        ci.session_id,
        ci.type,
        ci.quantity,
        ci.variant_id,
        ci.combo_id,
        d."DeviceName" as product_name,
        dv."Color" as color,
        dv."StorageCapacity" as capacity,
        dv."DepositAmount" as product_price,
        dv."DailyRentalPrice" as product_trial_price,
        d."Image" as product_image_url,
        c.name as combo_name,
        c.price as combo_price,
        c.image_url as combo_image_url
      FROM "cart_items" ci
      LEFT JOIN "Device_Variant" dv ON ci.variant_id = dv."VariantID"
      LEFT JOIN "Device" d ON dv."DeviceID" = d."DeviceID"
      LEFT JOIN "combos" c ON ci.combo_id = c.id
      WHERE ci.session_id = ?
      ORDER BY ci.added_at DESC
    `;
    const items = await query(sql, [sessionId]);
    
    return items.map(item => {
      let price = 0;
      let name = '';
      let image = '';
      let typeName = '';

      if (item.type === 'trial' && item.variant_id) {
        price = item.product_trial_price;
        name = `Thuê ${item.product_name} (${item.color}, ${item.capacity})`;
        image = item.product_image_url;
        typeName = 'Dùng thử';
      } else if (item.type === 'buy' && item.variant_id) {
        price = item.product_price;
        name = `${item.product_name} (${item.color}, ${item.capacity})`;
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
        id: item.variant_id || item.combo_id,
        name,
        price: parseFloat(price) || 0,
        image,
        type: typeName,
        quantity: item.quantity
      };
    });
  }

  static async addItem(sessionId, productId, comboId, type, quantity = 1, variantId = null) {
    let targetVariantId = variantId;

    // Nếu chỉ nhận được productId (ví dụ từ Trang chủ), tự động lấy Variant đầu tiên làm mặc định
    if (!targetVariantId && productId) {
      const defaultVar = await get('SELECT "VariantID" FROM "Device_Variant" WHERE "DeviceID" = ? LIMIT 1', [productId]);
      if (defaultVar) {
        targetVariantId = defaultVar.VariantID;
      }
    }

    // Check if it already exists to increment quantity
    const existing = await get(
      `SELECT id, quantity FROM "cart_items" 
       WHERE session_id = ? 
         AND COALESCE(variant_id, 0) = COALESCE(?, 0) 
         AND COALESCE(combo_id, 0) = COALESCE(?, 0) 
         AND type = ?`,
      [sessionId, targetVariantId || 0, comboId || 0, type]
    );

    if (existing) {
      const sql = `UPDATE "cart_items" SET quantity = quantity + ? WHERE id = ?`;
      await query(sql, [quantity, existing.id]);
      return existing.id;
    } else {
      const sql = `
        INSERT INTO "cart_items" (session_id, variant_id, combo_id, type, quantity)
        VALUES (?, ?, ?, ?, ?)
      `;
      const result = await query(sql, [sessionId, targetVariantId, comboId, type, quantity]);
      return true;
    }
  }

  static async removeItem(sessionId, cartItemId) {
    const sql = `DELETE FROM "cart_items" WHERE session_id = ? AND id = ?`;
    return await query(sql, [sessionId, cartItemId]);
  }

  static async updateQuantity(sessionId, cartItemId, quantity) {
    const sql = `UPDATE "cart_items" SET quantity = ? WHERE session_id = ? AND id = ?`;
    return await query(sql, [quantity, sessionId, cartItemId]);
  }

  static async clearCart(sessionId) {
    const sql = `DELETE FROM "cart_items" WHERE session_id = ?`;
    return await query(sql, [sessionId]);
  }
}

module.exports = CartModel;
