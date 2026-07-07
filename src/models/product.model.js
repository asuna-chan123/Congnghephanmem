const db = require('./db');

class ProductModel {
  static async getAllCategories() {
    const sql = `
      SELECT 
        category_id AS id, 
        category_name AS name,
        category_image AS image_url,
        CASE 
          WHEN category_id = 2 THEN 'dien-thoai'
          WHEN category_id = 3 THEN 'laptop'
          WHEN category_id = 4 THEN 'may-anh'
          WHEN category_id = 5 THEN 'phu-kien-quay-chup'
          WHEN category_id = 6 THEN 'phu-kien-van-phong'
          ELSE LOWER(REPLACE(category_name, ' ', '-'))
        END AS slug
      FROM equipment_categories
    `;
    return db.query(sql);
  }

  static async getProductsByCategory(categoryId) {
    const sql = `
      SELECT 
        d.device_id AS id,
        d.device_name AS name,
        d.manufacturer AS manufacturer,
        MIN(dv.deposit_amount) AS price,
        CAST(MIN(dv.deposit_amount) * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv.daily_rental_price) AS trial_price_per_day,
        d.default_image AS image_url,
        COALESCE((SELECT COUNT(*) FROM device_units du JOIN device_variants dv2 ON du.variant_id = dv2.variant_id WHERE dv2.device_id = d.device_id AND du.current_status = 'available'), 0) AS stock_quantity,
        d.category_id AS category_id,
        1 AS is_try_before_buy,
        CASE 
          WHEN d.category_id = 2 THEN 'chup-anh,hieu-nang,mong-nhe'
          WHEN d.category_id = 3 THEN 'van-phong,sang-trong,mong-nhe'
          ELSE 'chuyen-nghiep,vlog,du-lich'
        END AS tags
      FROM devices d
      JOIN device_variants dv ON d.device_id = dv.device_id
      WHERE d.category_id = ? AND d.is_active = TRUE
      GROUP BY d.device_id, d.device_name, d.default_image, d.category_id, d.description, d.manufacturer
    `;
    return db.query(sql, [categoryId]);
  }

  static async getTryBeforeBuyProducts() {
    const sql = `
      SELECT 
        d.device_id AS id,
        d.device_name AS name,
        d.manufacturer AS manufacturer,
        MIN(dv.deposit_amount) AS price,
        CAST(MIN(dv.deposit_amount) * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv.daily_rental_price) AS trial_price_per_day,
        d.default_image AS image_url,
        COALESCE((SELECT COUNT(*) FROM device_units du JOIN device_variants dv2 ON du.variant_id = dv2.variant_id WHERE dv2.device_id = d.device_id AND du.current_status = 'available'), 0) AS stock_quantity,
        d.category_id AS category_id,
        1 AS is_try_before_buy,
        CASE 
          WHEN d.category_id = 2 THEN 'chup-anh,hieu-nang,mong-nhe'
          WHEN d.category_id = 3 THEN 'van-phong,sang-trong,mong-nhe'
          ELSE 'chuyen-nghiep,vlog,du-lich'
        END AS tags
      FROM devices d
      JOIN device_variants dv ON d.device_id = dv.device_id
      WHERE d.is_active = TRUE
      GROUP BY d.device_id, d.device_name, d.default_image, d.category_id, d.description, d.manufacturer
    `;
    return db.query(sql);
  }

  static async getAllProducts() {
    const sql = `
      SELECT 
        d.device_id AS id,
        d.device_name AS name,
        d.manufacturer AS manufacturer,
        MIN(dv.deposit_amount) AS price,
        CAST(MIN(dv.deposit_amount) * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv.daily_rental_price) AS trial_price_per_day,
        d.default_image AS image_url,
        COALESCE((SELECT COUNT(*) FROM device_units du JOIN device_variants dv2 ON du.variant_id = dv2.variant_id WHERE dv2.device_id = d.device_id AND du.current_status = 'available'), 0) AS stock_quantity,
        d.category_id AS category_id,
        1 AS is_try_before_buy,
        CASE 
          WHEN d.category_id = 2 THEN 'chup-anh,hieu-nang,mong-nhe'
          WHEN d.category_id = 3 THEN 'van-phong,sang-trong,mong-nhe'
          ELSE 'chuyen-nghiep,vlog,du-lich'
        END AS tags
      FROM devices d
      JOIN device_variants dv ON d.device_id = dv.device_id
      WHERE d.is_active = TRUE
      GROUP BY d.device_id, d.device_name, d.default_image, d.category_id, d.description, d.manufacturer
    `;
    return db.query(sql);
  }

  static async getProductById(productId) {
    const sql = `
      SELECT 
        d.device_id AS id,
        d.device_name AS name,
        d.manufacturer AS manufacturer,
        d.description AS description,
        d.default_image AS image_url,
        d.category_id AS category_id,
        1 AS is_try_before_buy,
        MIN(dv.deposit_amount) AS price,
        CAST(MIN(dv.deposit_amount) * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv.daily_rental_price) AS trial_price_per_day,
        COALESCE((SELECT COUNT(*) FROM device_units du JOIN device_variants dv2 ON du.variant_id = dv2.variant_id WHERE dv2.device_id = d.device_id AND du.current_status = 'available'), 0) AS stock_quantity
      FROM devices d
      JOIN device_variants dv ON d.device_id = dv.device_id
      WHERE d.device_id = ? AND d.is_active = TRUE
      GROUP BY d.device_id, d.device_name, d.default_image, d.category_id, d.description, d.manufacturer
      LIMIT 1
    `;
    const product = await db.get(sql, [productId]);
    if (product) {
      // 1. Tải ảnh phụ
      const imagesSql = `
        SELECT 
          image_url AS url, 
          c.color_name AS color, 
          is_primary AS "isPrimary" 
        FROM device_images di
        LEFT JOIN colors c ON di.color_id = c.color_id
        WHERE device_id = ? 
        ORDER BY is_primary DESC, image_id ASC
      `;
      const imagesRows = await db.query(imagesSql, [productId]);
      product.images = imagesRows.length > 0 ? imagesRows : [{ url: product.image_url, color: null, isPrimary: true }];

      // 2. Tải các phiên bản cấu hình chi tiết (variants)
      const variantsSql = `
        SELECT 
          dv.variant_id AS id,
          dv.condition_name AS condition,
          c.color_name AS color,
          sc.capacity_value AS capacity,
          dv.daily_rental_price AS trial_price_per_day,
          dv.deposit_amount AS price,
          COALESCE((SELECT COUNT(*) FROM device_units du WHERE du.variant_id = dv.variant_id AND du.current_status = 'available'), 0) AS stock_quantity,
          'Available' AS status
        FROM device_variants dv
        LEFT JOIN colors c ON dv.color_id = c.color_id
        LEFT JOIN storage_capacities sc ON dv.capacity_id = sc.capacity_id
        WHERE dv.device_id = ? AND dv.is_active = TRUE
        ORDER BY dv.variant_id ASC
      `;
      product.variants = await db.query(variantsSql, [productId]);
    }
    return product;
  }

  static async getRelatedProducts(categoryId, excludeProductId) {
    const sql = `
      SELECT 
        d.device_id AS id,
        d.device_name AS name,
        d.manufacturer AS manufacturer,
        MIN(dv.deposit_amount) AS price,
        CAST(MIN(dv.deposit_amount) * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv.daily_rental_price) AS trial_price_per_day,
        d.default_image AS image_url,
        COALESCE((SELECT COUNT(*) FROM device_units du JOIN device_variants dv2 ON du.variant_id = dv2.variant_id WHERE dv2.device_id = d.device_id AND du.current_status = 'available'), 0) AS stock_quantity,
        d.category_id AS category_id,
        1 AS is_try_before_buy
      FROM devices d
      JOIN device_variants dv ON d.device_id = dv.device_id
      WHERE d.category_id = ? AND d.device_id != ? AND d.is_active = TRUE
      GROUP BY d.device_id, d.device_name, d.default_image, d.category_id, d.manufacturer
      LIMIT 6
    `;
    return db.query(sql, [categoryId, excludeProductId]);
  }

  static async getProductRentals(productId) {
    const sql = `
      SELECT 
        ro.rental_order_id AS id,
        dv.device_id AS product_id,
        ro.rental_start_date AS start_date,
        ro.expected_return_date AS end_date
      FROM rental_orders ro
      JOIN rental_order_details rod ON ro.rental_order_id = rod.rental_order_id
      JOIN device_variants dv ON rod.variant_id = dv.variant_id
      WHERE dv.device_id = ?
    `;
    return db.query(sql, [productId]);
  }

  static async addRental(productId, startDate, endDate) {
    // Lấy biến thể đầu tiên của thiết bị để tạo đơn thuê mẫu
    const variant = await db.get('SELECT variant_id, daily_rental_price, deposit_amount FROM device_variants WHERE device_id = ? LIMIT 1', [productId]);
    if (!variant) throw new Error('No variants found for product');

    const orderRes = await db.query(
      `INSERT INTO rental_orders (rental_start_date, expected_return_date, rental_order_status, customer_id, staff_id)
       VALUES (?, ?, 'active', 1, 2) RETURNING rental_order_id`,
      [startDate, endDate]
    );
    const orderId = orderRes[0].rental_order_id;

    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return db.query(
      `INSERT INTO rental_order_details (rental_order_id, variant_id, rental_days, unit_rental_price, unit_deposit_amount, rental_quantity)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [orderId, variant.variant_id, diffDays, variant.daily_rental_price, variant.deposit_amount]
    );
  }
}

module.exports = ProductModel;
