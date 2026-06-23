const db = require('./db');

class ProductModel {
  static async getAllCategories() {
    return db.query('SELECT * FROM categories');
  }

  static async getProductsByCategory(categoryId) {
    return db.query('SELECT * FROM products WHERE category_id = ?', [categoryId]);
  }

  static async getTryBeforeBuyProducts() {
    return db.query('SELECT * FROM products WHERE is_try_before_buy = 1');
  }

  static async getAllProducts() {
    return db.query('SELECT * FROM products');
  }

  static async getProductById(productId) {
    return db.get('SELECT * FROM products WHERE id = ?', [productId]);
  }

  static async getRelatedProducts(categoryId, excludeProductId) {
    return db.query('SELECT * FROM products WHERE category_id = ? AND id != ? LIMIT 6', [categoryId, excludeProductId]);
  }

  static async getProductRentals(productId) {
    return db.query('SELECT * FROM rentals WHERE product_id = ?', [productId]);
  }

  static async addRental(productId, startDate, endDate) {
    return db.query(
      'INSERT INTO rentals (product_id, start_date, end_date) VALUES (?, ?, ?)',
      [productId, startDate, endDate]
    );
  }

  static async getAllCombos() {
    const combos = await db.query('SELECT * FROM combos');
    
    // For each combo, query the constituent products
    for (let combo of combos) {
      combo.products = await db.query(`
        SELECT p.* FROM products p
        JOIN combo_products cp ON p.id = cp.product_id
        WHERE cp.combo_id = ?
      `, [combo.id]);
    }
    
    return combos;
  }
}

module.exports = ProductModel;
