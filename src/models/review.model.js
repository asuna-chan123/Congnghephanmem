const db = require('./db');

class ReviewModel {
  static async getReviewsByProduct(productId) {
    const sql = `
      SELECT 
        r.review_id AS id,
        dv.device_id AS product_id,
        c.full_name AS user_name,
        r.equipment_rating AS rating,
        r.comment AS comment,
        r.review_date AS created_at
      FROM reviews r
      LEFT JOIN customers c ON r.customer_id = c.customer_id
      JOIN device_variants dv ON r.variant_id = dv.variant_id
      WHERE dv.device_id = ?
      ORDER BY r.review_date DESC
    `;
    return db.query(sql, [productId]);
  }

  static async addReview(productId, userName, rating, comment) {
    // 1. Tìm hoặc tạo mới Customer
    let customer = await db.get('SELECT customer_id FROM customers WHERE full_name = ?', [userName]);
    let customerId;
    if (customer) {
      customerId = customer.customer_id;
    } else {
      const email = `user_${Date.now()}@example.com`;
      const insertCust = await db.query(
        'INSERT INTO customers (full_name, email) VALUES (?, ?) RETURNING customer_id',
        [userName, email]
      );
      customerId = insertCust[0].customer_id;
    }

    // 2. Lấy VariantID đầu tiên của sản phẩm để gán đánh giá
    const variant = await db.get('SELECT variant_id FROM device_variants WHERE device_id = ? LIMIT 1', [productId]);
    const variantId = variant ? variant.variant_id : null;

    return db.query(
      'INSERT INTO reviews (customer_id, variant_id, equipment_rating, service_rating, comment) VALUES (?, ?, ?, ?, ?)',
      [customerId, variantId, rating, rating, comment]
    );
  }
}

module.exports = ReviewModel;
