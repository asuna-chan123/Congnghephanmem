const { query, get } = require('./db');

class CartModel {
  static async getCartBySessionId(sessionId, customerId = null) {
    const whereClause = customerId ? 'ci.customer_id = ?' : 'ci.session_id = ?';
    const paramVal = customerId ? customerId : sessionId;

    const sql = `
      SELECT 
        ci.cart_item_id,
        ci.session_id,
        ci.quantity,
        ci.variant_id,
        ci.rental_start_date,
        ci.rental_end_date,
        d.device_name as product_name,
        c.color_name as color,
        sc.capacity_value as capacity,
        (dv.daily_rental_price * 10) as product_price,
        dv.daily_rental_price as product_trial_price,
        d.default_image as product_image_url,
        COALESCE((SELECT COUNT(*) FROM device_units du WHERE du.variant_id = dv.variant_id AND du.current_status = 'available'), 0) AS stock_quantity
      FROM cart_items ci
      LEFT JOIN device_variants dv ON ci.variant_id = dv.variant_id
      LEFT JOIN devices d ON dv.device_id = d.device_id
      LEFT JOIN colors c ON dv.color_id = c.color_id
      LEFT JOIN storage_capacities sc ON dv.capacity_id = sc.capacity_id
      WHERE ${whereClause}
      ORDER BY ci.created_at DESC
    `;
    const items = await query(sql, [paramVal]);

    return items.map(item => {
      const price = item.product_trial_price;
      const deposit = item.product_price;
      const name = `Thuê ${item.product_name} (${item.color}, ${item.capacity})`;
      const image = item.product_image_url;

      const startDate = new Date(item.rental_start_date);
      const endDate = new Date(item.rental_end_date);
      const diffTime = Math.abs(endDate - startDate);
      const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 || 1;

      return {
        cart_item_id: item.cart_item_id,
        uniqueId: item.cart_item_id,
        id: item.variant_id,
        name,
        price: parseFloat(price) || 0,
        deposit: parseFloat(deposit) || 0,
        rentalDays: rentalDays,
        image,
        type: 'trial',
        quantity: item.quantity,
        stock_quantity: item.stock_quantity,
        rental_start_date: item.rental_start_date,
        rental_end_date: item.rental_end_date
      };
    });
  }

  static async addItem(sessionId, customerId, productId, quantity = 1, variantId = null, rentalStartDate = null, rentalEndDate = null) {
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
    const existing = customerId
      ? await get(
        `SELECT cart_item_id as id, quantity FROM cart_items 
           WHERE customer_id = ? 
             AND variant_id = ?`,
        [customerId, targetVariantId]
      )
      : await get(
        `SELECT cart_item_id as id, quantity FROM cart_items 
           WHERE session_id = ? AND customer_id IS NULL
             AND variant_id = ?`,
        [sessionId, targetVariantId]
      );

    const totalRequestedQty = (existing ? existing.quantity : 0) + quantity;
    if (totalRequestedQty > stock) {
      throw new Error(`Rất tiếc, kho hàng chỉ còn lại ${stock} sản phẩm này.`);
    }

    if (existing) {
      const sql = `UPDATE cart_items SET quantity = quantity + ?, rental_start_date = ?, rental_end_date = ? WHERE cart_item_id = ?`;
      await query(sql, [quantity, rentalStartDate, rentalEndDate, existing.id]);
      return existing.id;
    } else {
      const sql = `
        INSERT INTO cart_items (session_id, customer_id, variant_id, quantity, rental_start_date, rental_end_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const result = await query(sql, [sessionId, customerId, targetVariantId, quantity, rentalStartDate, rentalEndDate]);
      return true;
    }
  }

  static async getCartItem(sessionId, customerId, cartItemId) {
    const sql = customerId
      ? `SELECT cart_item_id, variant_id, quantity FROM cart_items WHERE customer_id = ? AND cart_item_id = ?`
      : `SELECT cart_item_id, variant_id, quantity FROM cart_items WHERE session_id = ? AND cart_item_id = ?`;
    const params = customerId ? [customerId, cartItemId] : [sessionId, cartItemId];
    return await get(sql, params);
  }

  static async removeItem(sessionId, customerId, cartItemId) {
    const sql = customerId
      ? `DELETE FROM cart_items WHERE customer_id = ? AND cart_item_id = ?`
      : `DELETE FROM cart_items WHERE session_id = ? AND cart_item_id = ?`;
    const params = customerId ? [customerId, cartItemId] : [sessionId, cartItemId];
    return await query(sql, params);
  }

  static async updateQuantity(sessionId, customerId, cartItemId, quantity) {
    const sql = customerId
      ? `UPDATE cart_items SET quantity = ? WHERE customer_id = ? AND cart_item_id = ?`
      : `UPDATE cart_items SET quantity = ? WHERE session_id = ? AND cart_item_id = ?`;
    const params = customerId ? [quantity, customerId, cartItemId] : [quantity, sessionId, cartItemId];
    return await query(sql, params);
  }

  static async checkVariantStock(variantId) {
    const sql = `SELECT COALESCE((SELECT COUNT(*) FROM device_units du WHERE du.variant_id = ? AND du.current_status = 'available'), 0) AS stock`;
    const res = await get(sql, [variantId]);
    return res ? res.stock : 0;
  }

  static async clearCart(sessionId, customerId) {
    const sql = customerId
      ? `DELETE FROM cart_items WHERE customer_id = ?`
      : `DELETE FROM cart_items WHERE session_id = ?`;
    const params = customerId ? [customerId] : [sessionId];
    return await query(sql, params);
  }
}

module.exports = CartModel;
