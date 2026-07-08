const { query, get } = require('./db');

class CartModel {
  static async getCartBySessionId(sessionId) {
    const sql = `
      SELECT 
        ci.cart_item_id,
        ci.session_id,
        ci.type,
        ci.quantity,
        ci.variant_id,
        d.device_name as product_name,
        c.color_name as color,
        sc.capacity_value as capacity,
        dv.deposit_amount as product_price,
        dv.daily_rental_price as product_trial_price,
        d.default_image as product_image_url,
        COALESCE((SELECT COUNT(*) FROM device_units du WHERE du.variant_id = dv.variant_id AND du.current_status = 'available'), 0) AS stock_quantity
      FROM cart_items ci
      LEFT JOIN device_variants dv ON ci.variant_id = dv.variant_id
      LEFT JOIN devices d ON dv.device_id = d.device_id
      LEFT JOIN colors c ON dv.color_id = c.color_id
      LEFT JOIN storage_capacities sc ON dv.capacity_id = sc.capacity_id
      WHERE ci.session_id = ?
      ORDER BY ci.created_at DESC
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
      } else {
        price = item.product_price;
        name = `${item.product_name} (${item.color}, ${item.capacity})`;
        image = item.product_image_url;
        typeName = 'Mua đứt';
      }

      return {
        cart_item_id: item.cart_item_id,
        uniqueId: item.cart_item_id, // alias for frontend
        id: item.variant_id,
        name,
        price: parseFloat(price) || 0,
        image,
        type: typeName,
        quantity: item.quantity,
        stock_quantity: item.stock_quantity
      };
    });
  }

  static async addItem(sessionId, productId, type, quantity = 1, variantId = null) {
    let targetVariantId = variantId;

    // Nếu chỉ nhận được productId (ví dụ từ Trang chủ), tự động lấy Variant đầu tiên làm mặc định
    if (!targetVariantId && productId) {
      const defaultVar = await get('SELECT variant_id FROM device_variants WHERE device_id = ? LIMIT 1', [productId]);
      if (defaultVar) {
        targetVariantId = defaultVar.variant_id;
      }
    }

    if (!targetVariantId) {
      throw new Error('No variant found to add to cart');
    }

    // Get stock quantity of this variant
    const stockRes = await get(
      `SELECT COALESCE((SELECT COUNT(*) FROM device_units du WHERE du.variant_id = ? AND du.current_status = 'available'), 0) AS stock`,
      [targetVariantId]
    );
    const stock = stockRes ? stockRes.stock : 0;

    // Check if it already exists to increment quantity
    const existing = await get(
      `SELECT cart_item_id as id, quantity FROM cart_items 
       WHERE session_id = ? 
         AND variant_id = ? 
         AND type = ?`,
      [sessionId, targetVariantId, type]
    );

    const totalRequestedQty = (existing ? existing.quantity : 0) + quantity;
    if (totalRequestedQty > stock) {
      throw new Error(`Rất tiếc, kho hàng chỉ còn lại ${stock} sản phẩm này.`);
    }

    if (existing) {
      const sql = `UPDATE cart_items SET quantity = quantity + ? WHERE cart_item_id = ?`;
      await query(sql, [quantity, existing.id]);
      return existing.id;
    } else {
      const sql = `
        INSERT INTO cart_items (session_id, variant_id, type, quantity)
        VALUES (?, ?, ?, ?)
      `;
      const result = await query(sql, [sessionId, targetVariantId, type, quantity]);
      return true;
    }
  }

  static async getCartItem(sessionId, cartItemId) {
    const sql = `SELECT cart_item_id, variant_id, quantity FROM cart_items WHERE session_id = ? AND cart_item_id = ?`;
    return await get(sql, [sessionId, cartItemId]);
  }

  static async removeItem(sessionId, cartItemId) {
    const sql = `DELETE FROM cart_items WHERE session_id = ? AND cart_item_id = ?`;
    return await query(sql, [sessionId, cartItemId]);
  }

  static async updateQuantity(sessionId, cartItemId, quantity) {
    const sql = `UPDATE cart_items SET quantity = ? WHERE session_id = ? AND cart_item_id = ?`;
    return await query(sql, [quantity, sessionId, cartItemId]);
  }

  static async checkVariantStock(variantId) {
    const sql = `SELECT COALESCE((SELECT COUNT(*) FROM device_units du WHERE du.variant_id = ? AND du.current_status = 'available'), 0) AS stock`;
    const res = await get(sql, [variantId]);
    return res ? res.stock : 0;
  }

  static async clearCart(sessionId) {
    const sql = `DELETE FROM cart_items WHERE session_id = ?`;
    return await query(sql, [sessionId]);
  }
}

module.exports = CartModel;
