const db = require('./db');

class ReviewModel {
  static async getReviewsByProduct(productId) {
    return db.query('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [productId]);
  }

  static async addReview(productId, userName, rating, comment) {
    return db.query(
      'INSERT INTO reviews (product_id, user_name, rating, comment) VALUES (?, ?, ?, ?)',
      [productId, userName, rating, comment]
    );
  }
}

module.exports = ReviewModel;
