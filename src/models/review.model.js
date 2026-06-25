const db = require('./db');

class ReviewModel {
  static async getReviewsByProduct(productId) {
    const sql = `
      SELECT 
        r."ReviewID" AS id,
        dv."DeviceID" AS product_id,
        c."FullName" AS user_name,
        r."EquipmentRating" AS rating,
        r."Comment" AS comment,
        r."ReviewDate" AS created_at
      FROM "Review" r
      LEFT JOIN "Customer" c ON r."CustomerID" = c."CustomerID"
      JOIN "Device_Variant" dv ON r."VariantID" = dv."VariantID"
      WHERE dv."DeviceID" = ?
      ORDER BY r."ReviewDate" DESC
    `;
    return db.query(sql, [productId]);
  }

  static async addReview(productId, userName, rating, comment) {
    // 1. Tìm hoặc tạo mới Customer
    let customer = await db.get('SELECT "CustomerID" FROM "Customer" WHERE "FullName" = ?', [userName]);
    let customerId;
    if (customer) {
      customerId = customer.CustomerID;
    } else {
      const email = `user_${Date.now()}@example.com`;
      const insertCust = await db.query(
        'INSERT INTO "Customer" ("FullName", "Email") VALUES (?, ?) RETURNING "CustomerID"',
        [userName, email]
      );
      customerId = insertCust[0].CustomerID;
    }

    // 2. Lấy VariantID đầu tiên của sản phẩm để gán đánh giá
    const variant = await db.get('SELECT "VariantID" FROM "Device_Variant" WHERE "DeviceID" = ? LIMIT 1', [productId]);
    const variantId = variant ? variant.VariantID : null;

    return db.query(
      'INSERT INTO "Review" ("CustomerID", "VariantID", "EquipmentRating", "ServiceRating", "Comment") VALUES (?, ?, ?, ?, ?)',
      [customerId, variantId, rating, rating, comment]
    );
  }
}

module.exports = ReviewModel;
