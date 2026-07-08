const db = require('./db');

class ReviewModel {
  static async hasPurchasedProduct(customerId, productId) {
    // Check if the customer has a 'completed' order that contains any variant of the product
    const sql = `
      SELECT COUNT(*) as count 
      FROM rental_orders ro
      JOIN rental_order_details rod ON ro.rental_order_id = rod.rental_order_id
      JOIN device_variants dv ON rod.variant_id = dv.variant_id
      WHERE ro.customer_id = ? 
        AND dv.device_id = ? 
        AND ro.rental_order_status = 'completed'
    `;
    const res = await db.get(sql, [customerId, productId]);
    return res && parseInt(res.count, 10) > 0;
  }

  static async getReviewsAndQA(productId, currentCustomerId = null) {
    // 1. Get all reviews and Q&As
    const sql = `
      SELECT 
        r.review_id AS id,
        r.customer_id,
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
    const rows = await db.query(sql, [productId]);

    // 2. Fetch replies for each row, and calculate dynamic purchase badges
    for (const row of rows) {
      // Check if review author has purchased the product
      row.has_purchased = await this.hasPurchasedProduct(row.customer_id, productId);

      // Get replies
      const repliesSql = `
        SELECT 
          rr.reply_id AS id,
          rr.customer_id,
          rr.staff_id,
          c.full_name AS user_name,
          s.full_name AS staff_name,
          rr.reply_content AS comment,
          rr.reply_date AS created_at
        FROM review_replies rr
        LEFT JOIN customers c ON rr.customer_id = c.customer_id
        LEFT JOIN staff s ON rr.staff_id = s.staff_id
        WHERE rr.review_id = ?
        ORDER BY rr.reply_date ASC
      `;
      const replies = await db.query(repliesSql, [row.id]);

      // Calculate purchase status for replies
      for (const reply of replies) {
        if (reply.staff_id) {
          reply.is_staff = true;
          reply.has_purchased = false; // staff doesn't buy
        } else {
          reply.is_staff = false;
          reply.has_purchased = await this.hasPurchasedProduct(reply.customer_id, productId);
        }
      }
      row.replies = replies;
    }

    // Separate into reviews and Q&A
    const reviews = rows.filter(r => r.rating !== null && r.rating !== undefined);
    const qa = rows.filter(r => r.rating === null || r.rating === undefined);

    return { reviews, qa };
  }

  static async addReviewOrQA(customerId, productId, rating, comment) {
    // Get first variant of the product
    const variant = await db.get('SELECT variant_id FROM device_variants WHERE device_id = ? LIMIT 1', [productId]);
    if (!variant) {
      throw new Error('Không tìm thấy cấu hình sản phẩm.');
    }

    const variantId = variant.variant_id;

    if (rating !== null && rating !== undefined) {
      // Eligibility check for reviews
      const eligible = await this.hasPurchasedProduct(customerId, productId);
      if (!eligible) {
        throw new Error('Chỉ khách hàng đã thuê thành công sản phẩm này mới có thể viết đánh giá.');
      }
    }

    const sql = `
      INSERT INTO reviews (customer_id, variant_id, equipment_rating, service_rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(sql, [customerId, variantId, rating, rating, comment]);
    return true;
  }

  static async addReply(reviewId, customerId, staffId, content) {
    const sql = `
      INSERT INTO review_replies (review_id, customer_id, staff_id, reply_content)
      VALUES (?, ?, ?, ?)
    `;
    await db.query(sql, [reviewId, customerId || null, staffId || null, content]);
    return true;
  }
}

module.exports = ReviewModel;
