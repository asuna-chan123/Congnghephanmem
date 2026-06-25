const db = require('./db');

class ProductModel {
  static async getAllCategories() {
    const sql = `
      SELECT 
        "CategoryId" AS id, 
        "CategoryName" AS name,
        CASE 
          WHEN "CategoryId" = 1 THEN 'dien-thoai'
          WHEN "CategoryId" = 2 THEN 'laptop'
          WHEN "CategoryId" = 3 THEN 'may-anh'
          ELSE LOWER(REPLACE("CategoryName", ' ', '-'))
        END AS slug
      FROM "Equipment_Category"
    `;
    return db.query(sql);
  }

  static async getProductsByCategory(categoryId) {
    const sql = `
      SELECT 
        d."DeviceID" AS id,
        d."DeviceName" AS name,
        MIN(dv."DepositAmount") AS price,
        CAST(MIN(dv."DepositAmount") * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv."DailyRentalPrice") AS trial_price_per_day,
        d."Image" AS image_url,
        SUM(dv."Quantity") AS stock_quantity,
        d."CategoryId" AS category_id,
        1 AS is_try_before_buy,
        CASE 
          WHEN d."CategoryId" = 1 THEN 'chup-anh,hieu-nang,mong-nhe'
          WHEN d."CategoryId" = 2 THEN 'van-phong,sang-trong,mong-nhe'
          ELSE 'chuyen-nghiep,vlog,du-lich'
        END AS tags
      FROM "Device" d
      JOIN "Device_Variant" dv ON d."DeviceID" = dv."DeviceID"
      WHERE d."CategoryId" = ?
      GROUP BY d."DeviceID", d."DeviceName", d."Image", d."CategoryId", d."Description"
    `;
    return db.query(sql, [categoryId]);
  }

  static async getTryBeforeBuyProducts() {
    const sql = `
      SELECT 
        d."DeviceID" AS id,
        d."DeviceName" AS name,
        MIN(dv."DepositAmount") AS price,
        CAST(MIN(dv."DepositAmount") * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv."DailyRentalPrice") AS trial_price_per_day,
        d."Image" AS image_url,
        SUM(dv."Quantity") AS stock_quantity,
        d."CategoryId" AS category_id,
        1 AS is_try_before_buy,
        CASE 
          WHEN d."CategoryId" = 1 THEN 'chup-anh,hieu-nang,mong-nhe'
          WHEN d."CategoryId" = 2 THEN 'van-phong,sang-trong,mong-nhe'
          ELSE 'chuyen-nghiep,vlog,du-lich'
        END AS tags
      FROM "Device" d
      JOIN "Device_Variant" dv ON d."DeviceID" = dv."DeviceID"
      GROUP BY d."DeviceID", d."DeviceName", d."Image", d."CategoryId", d."Description"
    `;
    return db.query(sql);
  }

  static async getAllProducts() {
    const sql = `
      SELECT 
        d."DeviceID" AS id,
        d."DeviceName" AS name,
        MIN(dv."DepositAmount") AS price,
        CAST(MIN(dv."DepositAmount") * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv."DailyRentalPrice") AS trial_price_per_day,
        d."Image" AS image_url,
        SUM(dv."Quantity") AS stock_quantity,
        d."CategoryId" AS category_id,
        1 AS is_try_before_buy,
        CASE 
          WHEN d."CategoryId" = 1 THEN 'chup-anh,hieu-nang,mong-nhe'
          WHEN d."CategoryId" = 2 THEN 'van-phong,sang-trong,mong-nhe'
          ELSE 'chuyen-nghiep,vlog,du-lich'
        END AS tags
      FROM "Device" d
      JOIN "Device_Variant" dv ON d."DeviceID" = dv."DeviceID"
      GROUP BY d."DeviceID", d."DeviceName", d."Image", d."CategoryId", d."Description"
    `;
    return db.query(sql);
  }

  static async getProductById(productId) {
    const sql = `
      SELECT 
        d."DeviceID" AS id,
        d."DeviceName" AS name,
        d."Description" AS description,
        d."Image" AS image_url,
        d."CategoryId" AS category_id,
        1 AS is_try_before_buy,
        MIN(dv."DepositAmount") AS price,
        CAST(MIN(dv."DepositAmount") * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv."DailyRentalPrice") AS trial_price_per_day,
        SUM(dv."Quantity") AS stock_quantity
      FROM "Device" d
      JOIN "Device_Variant" dv ON d."DeviceID" = dv."DeviceID"
      WHERE d."DeviceID" = ?
      GROUP BY d."DeviceID", d."DeviceName", d."Image", d."CategoryId", d."Description"
      LIMIT 1
    `;
    const product = await db.get(sql, [productId]);
    if (product) {
      // 1. Tải ảnh phụ
      const imagesSql = `SELECT "ImageURL" AS url, "Color" AS color, "IsPrimary" AS "isPrimary" FROM "Device_Image" WHERE "DeviceID" = ? ORDER BY "IsPrimary" DESC, "ImageId" ASC`;
      const imagesRows = await db.query(imagesSql, [productId]);
      product.images = imagesRows.length > 0 ? imagesRows : [{ url: product.image_url, color: null, isPrimary: true }];

      // 2. Tải các phiên bản cấu hình chi tiết (variants)
      const variantsSql = `
        SELECT 
          "VariantID" AS id,
          "Condition" AS condition,
          "Color" AS color,
          "StorageCapacity" AS capacity,
          "DailyRentalPrice" AS trial_price_per_day,
          "DepositAmount" AS price,
          "Quantity" AS stock_quantity,
          "DeviceStatus" AS status
        FROM "Device_Variant"
        WHERE "DeviceID" = ?
        ORDER BY "VariantID" ASC
      `;
      product.variants = await db.query(variantsSql, [productId]);
    }
    return product;
  }

  static async getRelatedProducts(categoryId, excludeProductId) {
    const sql = `
      SELECT 
        d."DeviceID" AS id,
        d."DeviceName" AS name,
        MIN(dv."DepositAmount") AS price,
        CAST(MIN(dv."DepositAmount") * 1.15 AS DECIMAL(12,2)) AS original_price,
        MIN(dv."DailyRentalPrice") AS trial_price_per_day,
        d."Image" AS image_url,
        SUM(dv."Quantity") AS stock_quantity,
        d."CategoryId" AS category_id,
        1 AS is_try_before_buy
      FROM "Device" d
      JOIN "Device_Variant" dv ON d."DeviceID" = dv."DeviceID"
      WHERE d."CategoryId" = ? AND d."DeviceID" != ?
      GROUP BY d."DeviceID", d."DeviceName", d."Image", d."CategoryId"
      LIMIT 6
    `;
    return db.query(sql, [categoryId, excludeProductId]);
  }

  static async getProductRentals(productId) {
    const sql = `
      SELECT 
        ro."RentalOrderID" AS id,
        dv."DeviceID" AS product_id,
        ro."RentalStartDate" AS start_date,
        ro."ExpectedReturnDate" AS end_date
      FROM "RentalOrder" ro
      JOIN "RentalOrderDetail" rod ON ro."RentalOrderID" = rod."RentalOrderID"
      JOIN "Device_Variant" dv ON rod."VariantID" = dv."VariantID"
      WHERE dv."DeviceID" = ?
    `;
    return db.query(sql, [productId]);
  }

  static async addRental(productId, startDate, endDate) {
    // Lấy biến thể đầu tiên của thiết bị để tạo đơn thuê mẫu
    const variant = await db.get('SELECT "VariantID", "DailyRentalPrice" FROM "Device_Variant" WHERE "DeviceID" = ? LIMIT 1', [productId]);
    if (!variant) throw new Error('No variants found for product');

    const orderRes = await db.query(
      `INSERT INTO "RentalOrder" ("RentalStartDate", "ExpectedReturnDate", "RentalOrderStatus", "CustomerID", "StaffID")
       VALUES (?, ?, 'Active', 1, 1) RETURNING "RentalOrderID"`,
      [startDate, endDate]
    );
    const orderId = orderRes[0].RentalOrderID;

    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return db.query(
      `INSERT INTO "RentalOrderDetail" ("RentalOrderID", "VariantID", "RentalDays", "UnitRentalPrice", "RentalQuantity")
       VALUES (?, ?, ?, ?, 1)`,
      [orderId, variant.VariantID, diffDays, variant.DailyRentalPrice]
    );
  }

  static async getAllCombos() {
    const combos = await db.query('SELECT * FROM "combos"');
    
    for (let combo of combos) {
      combo.products = await db.query(`
        SELECT 
          d."DeviceID" AS id,
          d."DeviceName" AS name,
          dv."DepositAmount" AS price,
          dv."DailyRentalPrice" AS trial_price_per_day,
          d."Image" AS image_url,
          dv."Quantity" AS stock_quantity,
          d."CategoryId" AS category_id
        FROM "Device" d
        JOIN "Device_Variant" dv ON d."DeviceID" = dv."DeviceID"
        JOIN "combo_products" cp ON dv."VariantID" = cp.variant_id
        WHERE cp.combo_id = ?
      `, [combo.id]);
    }
    
    return combos;
  }
}

module.exports = ProductModel;
