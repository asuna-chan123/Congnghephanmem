const { query, get } = require('../models/db');
const logger = require('../utils/logger');

class AdminController {

  // ==========================================
  // METADATA (COLORS, CAPACITIES, CATEGORIES)
  // ==========================================

  static async getMetadata(req, res) {
    try {
      const colors = await query('SELECT color_id AS id, color_name AS name, hex_code FROM colors ORDER BY color_id ASC');
      const capacities = await query('SELECT capacity_id AS id, capacity_value AS name FROM storage_capacities ORDER BY capacity_id ASC');
      const categories = await query('SELECT category_id AS id, category_name AS name FROM equipment_categories WHERE is_active = TRUE OR deleted_at IS NULL ORDER BY category_id ASC');

      res.json({
        success: true,
        colors,
        capacities,
        categories
      });
    } catch (err) {
      logger.error('Error fetching admin metadata:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createColor(req, res) {
    try {
      const { color_name, hex_code } = req.body;
      if (!color_name) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên màu.' });

      const result = await query(
        'INSERT INTO colors (color_name, hex_code) VALUES ($1, $2) RETURNING color_id, color_name, hex_code',
        [color_name, hex_code || '#000000']
      );
      res.json({ success: true, message: 'Thêm màu sắc thành công!', color: result[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createCapacity(req, res) {
    try {
      const { capacity_value } = req.body;
      if (!capacity_value) return res.status(400).json({ success: false, message: 'Vui lòng nhập dung lượng/phân loại.' });

      const result = await query(
        'INSERT INTO storage_capacities (capacity_value) VALUES ($1) RETURNING capacity_id, capacity_value',
        [capacity_value]
      );
      res.json({ success: true, message: 'Thêm phân loại dung lượng thành công!', capacity: result[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // 1. QUẢN LÝ THIẾT BỊ (DEVICES & VARIANTS)
  // ==========================================

  // Lấy danh sách thiết bị kèm daily_rental_price, số lượng phân loại, số lượng ảnh
  static async getDevices(req, res) {
    try {
      const { status } = req.query; // 'all', 'active', 'deleted'
      let whereClause = '';

      if (status === 'deleted') {
        whereClause = 'WHERE d.is_active = FALSE OR d.deleted_at IS NOT NULL';
      } else if (status === 'active') {
        whereClause = 'WHERE d.is_active = TRUE AND d.deleted_at IS NULL';
      }

      const sql = `
        SELECT 
          d.device_id AS id,
          d.device_name AS name,
          d.manufacturer,
          d.description,
          d.default_image AS image_url,
          d.category_id,
          ec.category_name,
          d.is_active,
          d.deleted_at,
          COALESCE(MIN(dv.daily_rental_price), 0) AS daily_rental_price,
          COUNT(DISTINCT dv.variant_id) AS variant_count,
          COALESCE((
            SELECT COUNT(*) 
            FROM device_units du 
            JOIN device_variants dv2 ON du.variant_id = dv2.variant_id 
            WHERE dv2.device_id = d.device_id AND du.current_status = 'available'
          ), 0) AS available_stock,
          COALESCE((
            SELECT COUNT(*) 
            FROM device_units du 
            JOIN device_variants dv3 ON du.variant_id = dv3.variant_id 
            WHERE dv3.device_id = d.device_id
          ), 0) AS total_stock,
          COALESCE((
            SELECT COUNT(*) 
            FROM device_images di 
            WHERE di.device_id = d.device_id
          ), 0) AS image_count
        FROM devices d
        LEFT JOIN device_variants dv ON d.device_id = dv.device_id AND (dv.is_active = TRUE OR dv.deleted_at IS NULL)
        LEFT JOIN equipment_categories ec ON d.category_id = ec.category_id
        ${whereClause}
        GROUP BY d.device_id, d.device_name, d.manufacturer, d.description, d.default_image, d.category_id, ec.category_name, d.is_active, d.deleted_at
        ORDER BY d.device_id DESC
      `;

      const devices = await query(sql);
      res.json({ success: true, devices });
    } catch (err) {
      logger.error('Error fetching admin devices:', err);
      res.status(500).json({ success: false, message: 'Lỗi tải danh sách thiết bị: ' + err.message });
    }
  }

  // Lấy chi tiết toàn diện 1 thiết bị: Thông tin máy + Danh sách Biến thể (variants) + Bộ sưu tập ảnh (images)
  static async getDeviceDetails(req, res) {
    try {
      const deviceId = parseInt(req.params.id, 10);
      if (!deviceId) return res.status(400).json({ success: false, message: 'ID thiết bị không hợp lệ.' });

      // 1. Thông tin cơ bản thiết bị
      const devSql = `
        SELECT 
          d.device_id AS id,
          d.device_name AS name,
          d.manufacturer,
          d.description,
          d.default_image AS image_url,
          d.category_id,
          ec.category_name,
          d.is_active,
          d.deleted_at,
          COALESCE((
            SELECT MIN(daily_rental_price) 
            FROM device_variants dv 
            WHERE dv.device_id = d.device_id AND (dv.is_active = TRUE OR dv.deleted_at IS NULL)
          ), 0) AS daily_rental_price
        FROM devices d
        LEFT JOIN equipment_categories ec ON d.category_id = ec.category_id
        WHERE d.device_id = $1
      `;
      const devRows = await query(devSql, [deviceId]);
      if (!devRows.length) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị.' });
      }
      const device = devRows[0];

      // 2. Danh sách biến thể (variants: màu sắc x dung lượng x giá thuê daily_rental_price)
      const varSql = `
        SELECT 
          dv.variant_id,
          dv.device_id,
          dv.color_id,
          c.color_name,
          c.hex_code,
          dv.capacity_id,
          sc.capacity_value,
          dv.condition_name,
          dv.daily_rental_price,
          dv.is_active,
          dv.deleted_at,
          COALESCE((
            SELECT COUNT(*) 
            FROM device_units du 
            WHERE du.variant_id = dv.variant_id AND du.current_status = 'available'
          ), 0) AS available_stock,
          COALESCE((
            SELECT COUNT(*) 
            FROM device_units du 
            WHERE du.variant_id = dv.variant_id
          ), 0) AS total_stock
        FROM device_variants dv
        LEFT JOIN colors c ON dv.color_id = c.color_id
        LEFT JOIN storage_capacities sc ON dv.capacity_id = sc.capacity_id
        WHERE dv.device_id = $1
        ORDER BY dv.variant_id ASC
      `;
      const variants = await query(varSql, [deviceId]);

      // 3. Bộ sưu tập hình ảnh theo màu sắc (device_images)
      const imgSql = `
        SELECT 
          di.image_id,
          di.device_id,
          di.color_id,
          c.color_name,
          c.hex_code,
          di.image_url,
          di.is_primary,
          di.created_at
        FROM device_images di
        LEFT JOIN colors c ON di.color_id = c.color_id
        WHERE di.device_id = $1
        ORDER BY di.is_primary DESC, di.image_id ASC
      `;
      const images = await query(imgSql, [deviceId]);

      res.json({
        success: true,
        device,
        variants,
        images
      });
    } catch (err) {
      logger.error(`Error fetching device #${req.params.id} details:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Thêm thiết bị mới (hỗ trợ thêm kèm danh sách variants và images)
  static async createDevice(req, res) {
    try {
      const {
        device_name,
        category_id,
        manufacturer,
        description,
        default_image,
        daily_rental_price,
        initial_stock,
        color_id,
        capacity_id,
        variants, // mảng [{ color_id, capacity_id, condition_name, daily_rental_price, stock }]
        images   // mảng [{ color_id, image_url, is_primary }]
      } = req.body;

      if (!device_name) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tên thiết bị.' });
      }

      const primaryImage = default_image || (images && images.length ? images[0].image_url : '/images/laptop.jpg');

      // 1. Thêm vào bảng devices
      const insertDevSql = `
        INSERT INTO devices (device_name, category_id, manufacturer, description, default_image, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING device_id
      `;
      const devRows = await query(insertDevSql, [
        device_name,
        category_id ? parseInt(category_id, 10) : null,
        manufacturer || 'Apple',
        description || '',
        primaryImage
      ]);
      const deviceId = devRows[0].device_id;

      // 2. Thêm các Biến thể (Variants)
      if (Array.isArray(variants) && variants.length > 0) {
        for (const v of variants) {
          const varSql = `
            INSERT INTO device_variants (device_id, color_id, capacity_id, condition_name, daily_rental_price, is_active)
            VALUES ($1, $2, $3, $4, $5, TRUE)
            RETURNING variant_id
          `;
          const varRows = await query(varSql, [
            deviceId,
            v.color_id ? parseInt(v.color_id, 10) : null,
            v.capacity_id ? parseInt(v.capacity_id, 10) : null,
            v.condition_name || 'New',
            parseFloat(v.daily_rental_price || daily_rental_price || 150000)
          ]);
          const variantId = varRows[0].variant_id;

          // Tạo các device_units
          const stock = v.stock ? parseInt(v.stock, 10) : 3;
          for (let i = 1; i <= stock; i++) {
            await query(
              `INSERT INTO device_units (variant_id, unit_code, current_status) VALUES ($1, $2, 'available')`,
              [variantId, `DEV-${deviceId}-V${variantId}-${Date.now()}-${i}`]
            );
          }
        }
      } else {
        // Tạo 1 variant mặc định nếu không truyền mảng
        const varSql = `
          INSERT INTO device_variants (device_id, color_id, capacity_id, condition_name, daily_rental_price, is_active)
          VALUES ($1, $2, $3, 'New', $4, TRUE)
          RETURNING variant_id
        `;
        const varRows = await query(varSql, [
          deviceId,
          color_id ? parseInt(color_id, 10) : null,
          capacity_id ? parseInt(capacity_id, 10) : null,
          parseFloat(daily_rental_price || 150000)
        ]);
        const variantId = varRows[0].variant_id;

        const stock = initial_stock ? parseInt(initial_stock, 10) : 3;
        for (let i = 1; i <= stock; i++) {
          await query(
            `INSERT INTO device_units (variant_id, unit_code, current_status) VALUES ($1, $2, 'available')`,
            [variantId, `DEV-${deviceId}-V${variantId}-${Date.now()}-${i}`]
          );
        }
      }

      // 3. Thêm các Hình ảnh (device_images)
      if (Array.isArray(images) && images.length > 0) {
        for (const img of images) {
          if (img.image_url) {
            await query(
              `INSERT INTO device_images (device_id, color_id, image_url, is_primary) VALUES ($1, $2, $3, $4)`,
              [
                deviceId,
                img.color_id ? parseInt(img.color_id, 10) : null,
                img.image_url,
                img.is_primary ? true : false
              ]
            );
          }
        }
      } else if (primaryImage) {
        // Lưu ảnh chính vào device_images
        await query(
          `INSERT INTO device_images (device_id, color_id, image_url, is_primary) VALUES ($1, $2, $3, TRUE)`,
          [deviceId, color_id ? parseInt(color_id, 10) : null, primaryImage]
        );
      }

      logger.info(`Admin created device #${deviceId} with variants and images.`);
      res.json({ success: true, message: 'Thêm thiết bị mới thành công!', device_id: deviceId });
    } catch (err) {
      logger.error('Error creating device:', err);
      res.status(500).json({ success: false, message: 'Lỗi thêm thiết bị: ' + err.message });
    }
  }

  // Cập nhật thông tin cơ bản thiết bị
  static async updateDevice(req, res) {
    try {
      const deviceId = parseInt(req.params.id, 10);
      const { device_name, category_id, manufacturer, description, default_image, daily_rental_price } = req.body;

      if (!deviceId) return res.status(400).json({ success: false, message: 'ID thiết bị không hợp lệ.' });

      // Cập nhật bảng devices
      const updateDevSql = `
        UPDATE devices 
        SET device_name = COALESCE($1, device_name),
            category_id = COALESCE($2, category_id),
            manufacturer = COALESCE($3, manufacturer),
            description = COALESCE($4, description),
            default_image = COALESCE($5, default_image)
        WHERE device_id = $6
      `;
      await query(updateDevSql, [
        device_name,
        category_id ? parseInt(category_id, 10) : null,
        manufacturer,
        description,
        default_image,
        deviceId
      ]);

      // Nếu có cập nhật daily_rental_price, cập nhật tất cả variant của máy này
      if (daily_rental_price !== undefined && daily_rental_price !== null) {
        await query(
          `UPDATE device_variants SET daily_rental_price = $1 WHERE device_id = $2`,
          [parseFloat(daily_rental_price), deviceId]
        );
      }

      logger.info(`Admin updated device #${deviceId}`);
      res.json({ success: true, message: 'Cập nhật thiết bị thành công!' });
    } catch (err) {
      logger.error('Error updating device:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Xóa mềm thiết bị (Soft Delete)
  static async softDeleteDevice(req, res) {
    try {
      const deviceId = parseInt(req.params.id, 10);
      if (!deviceId) return res.status(400).json({ success: false, message: 'ID thiết bị không hợp lệ.' });

      await query(
        `UPDATE devices SET is_active = FALSE, deleted_at = NOW() WHERE device_id = $1`,
        [deviceId]
      );
      await query(
        `UPDATE device_variants SET is_active = FALSE, deleted_at = NOW() WHERE device_id = $1`,
        [deviceId]
      );

      logger.info(`Admin soft-deleted device #${deviceId}`);
      res.json({ success: true, message: 'Đã xóa mềm thiết bị (chuyển vào thùng rác)!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Khôi phục thiết bị đã xóa mềm (Restore)
  static async restoreDevice(req, res) {
    try {
      const deviceId = parseInt(req.params.id, 10);
      if (!deviceId) return res.status(400).json({ success: false, message: 'ID thiết bị không hợp lệ.' });

      await query(
        `UPDATE devices SET is_active = TRUE, deleted_at = NULL WHERE device_id = $1`,
        [deviceId]
      );
      await query(
        `UPDATE device_variants SET is_active = TRUE, deleted_at = NULL WHERE device_id = $1`,
        [deviceId]
      );

      logger.info(`Admin restored device #${deviceId}`);
      res.json({ success: true, message: 'Đã khôi phục thiết bị thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // QUẢN LÝ BIẾN THỂ RIÊNG BIỆT (DEVICE_VARIANTS)
  // ==========================================

  // Thêm một phân loại mới cho thiết bị
  static async addVariant(req, res) {
    try {
      const deviceId = parseInt(req.params.id, 10);
      const { color_id, capacity_id, condition_name, daily_rental_price, initial_stock } = req.body;

      if (!deviceId || !daily_rental_price) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập giá thuê hàng ngày.' });
      }

      const sql = `
        INSERT INTO device_variants (device_id, color_id, capacity_id, condition_name, daily_rental_price, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING variant_id
      `;
      const rows = await query(sql, [
        deviceId,
        color_id ? parseInt(color_id, 10) : null,
        capacity_id ? parseInt(capacity_id, 10) : null,
        condition_name || 'New',
        parseFloat(daily_rental_price)
      ]);
      const variantId = rows[0].variant_id;

      // Tạo units tồn kho
      const stock = initial_stock ? parseInt(initial_stock, 10) : 3;
      for (let i = 1; i <= stock; i++) {
        await query(
          `INSERT INTO device_units (variant_id, unit_code, current_status) VALUES ($1, $2, 'available')`,
          [variantId, `DEV-${deviceId}-V${variantId}-${Date.now()}-${i}`]
        );
      }

      logger.info(`Admin added variant #${variantId} to device #${deviceId}`);
      res.json({ success: true, message: 'Thêm phân loại mới thành công!', variant_id: variantId });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Cập nhật giá và tình trạng của một biến thể
  static async updateVariant(req, res) {
    try {
      const variantId = parseInt(req.params.id, 10);
      const { daily_rental_price, condition_name, color_id, capacity_id } = req.body;

      await query(`
        UPDATE device_variants
        SET daily_rental_price = COALESCE($1, daily_rental_price),
            condition_name = COALESCE($2, condition_name),
            color_id = COALESCE($3, color_id),
            capacity_id = COALESCE($4, capacity_id)
        WHERE variant_id = $5
      `, [
        daily_rental_price ? parseFloat(daily_rental_price) : null,
        condition_name,
        color_id ? parseInt(color_id, 10) : null,
        capacity_id ? parseInt(capacity_id, 10) : null,
        variantId
      ]);

      res.json({ success: true, message: 'Cập nhật phân loại thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Xóa mềm một biến thể
  static async softDeleteVariant(req, res) {
    try {
      const variantId = parseInt(req.params.id, 10);
      await query(
        `UPDATE device_variants SET is_active = FALSE, deleted_at = NOW() WHERE variant_id = $1`,
        [variantId]
      );
      res.json({ success: true, message: 'Đã xóa mềm phân loại này!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Khôi phục một biến thể
  static async restoreVariant(req, res) {
    try {
      const variantId = parseInt(req.params.id, 10);
      await query(
        `UPDATE device_variants SET is_active = TRUE, deleted_at = NULL WHERE variant_id = $1`,
        [variantId]
      );
      res.json({ success: true, message: 'Đã khôi phục phân loại thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // QUẢN LÝ HÌNH ẢNH THEO MÀU (DEVICE_IMAGES)
  // ==========================================

  // Thêm hình ảnh mới cho thiết bị
  static async addDeviceImage(req, res) {
    try {
      const deviceId = parseInt(req.params.id, 10);
      const { color_id, image_url, is_primary } = req.body;

      if (!deviceId || !image_url) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp link hình ảnh.' });
      }

      // Nếu đặt làm ảnh chính, bỏ ảnh chính của các ảnh cũ và cập nhật devices.default_image
      if (is_primary) {
        await query(`UPDATE device_images SET is_primary = FALSE WHERE device_id = $1`, [deviceId]);
        await query(`UPDATE devices SET default_image = $1 WHERE device_id = $2`, [image_url, deviceId]);
      }

      const sql = `
        INSERT INTO device_images (device_id, color_id, image_url, is_primary)
        VALUES ($1, $2, $3, $4)
        RETURNING image_id
      `;
      const rows = await query(sql, [
        deviceId,
        color_id ? parseInt(color_id, 10) : null,
        image_url,
        is_primary ? true : false
      ]);

      logger.info(`Admin added image #${rows[0].image_id} for device #${deviceId}`);
      res.json({ success: true, message: 'Thêm hình ảnh thành công!', image_id: rows[0].image_id });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Đặt làm ảnh đại diện chính của thiết bị
  static async setImagePrimary(req, res) {
    try {
      const imageId = parseInt(req.params.id, 10);
      const imgRows = await query(`SELECT device_id, image_url FROM device_images WHERE image_id = $1`, [imageId]);
      if (!imgRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy hình ảnh.' });

      const { device_id, image_url } = imgRows[0];
      await query(`UPDATE device_images SET is_primary = FALSE WHERE device_id = $1`, [device_id]);
      await query(`UPDATE device_images SET is_primary = TRUE WHERE image_id = $1`, [imageId]);
      await query(`UPDATE devices SET default_image = $1 WHERE device_id = $2`, [image_url, device_id]);

      res.json({ success: true, message: 'Đã đặt làm ảnh chính của thiết bị!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Xóa ảnh
  static async deleteDeviceImage(req, res) {
    try {
      const imageId = parseInt(req.params.id, 10);
      await query(`DELETE FROM device_images WHERE image_id = $1`, [imageId]);
      res.json({ success: true, message: 'Đã xóa hình ảnh thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // 2. QUẢN LÝ DANH MỤC (CATEGORIES CRUD)
  // ==========================================

  static async getCategories(req, res) {
    try {
      const { status } = req.query;
      let whereClause = '';
      if (status === 'active' || !status) {
        whereClause = 'WHERE ec.is_active = TRUE OR ec.deleted_at IS NULL';
      } else if (status === 'deleted') {
        whereClause = 'WHERE ec.is_active = FALSE OR ec.deleted_at IS NOT NULL';
      }

      const sql = `
        SELECT 
          ec.category_id AS id,
          ec.category_name AS name,
          ec.category_image AS image_url,
          ec.is_active,
          ec.deleted_at,
          COUNT(d.device_id) FILTER (WHERE d.is_active = TRUE AND d.deleted_at IS NULL) AS active_device_count,
          COUNT(d.device_id) AS total_device_count
        FROM equipment_categories ec
        LEFT JOIN devices d ON ec.category_id = d.category_id
        ${whereClause}
        GROUP BY ec.category_id, ec.category_name, ec.category_image, ec.is_active, ec.deleted_at
        ORDER BY ec.category_id ASC
      `;
      const categories = await query(sql);
      res.json({ success: true, categories });
    } catch (err) {
      logger.error('Error fetching categories:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createCategory(req, res) {
    try {
      const { category_name, category_image } = req.body;
      if (!category_name) {
        return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống.' });
      }
      const sql = `
        INSERT INTO equipment_categories (category_name, category_image, is_active)
        VALUES ($1, $2, TRUE)
        RETURNING category_id
      `;
      const result = await query(sql, [category_name, category_image || '']);
      res.json({ success: true, message: 'Thêm danh mục thành công!', category_id: result[0].category_id });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateCategory(req, res) {
    try {
      const catId = parseInt(req.params.id, 10);
      const { category_name, category_image } = req.body;
      await query(
        `UPDATE equipment_categories SET category_name = COALESCE($1, category_name), category_image = COALESCE($2, category_image) WHERE category_id = $3`,
        [category_name, category_image, catId]
      );
      res.json({ success: true, message: 'Cập nhật danh mục thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Xóa mềm danh mục
  static async softDeleteCategory(req, res) {
    try {
      const catId = parseInt(req.params.id, 10);
      if (!catId) return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ.' });

      await query(
        `UPDATE equipment_categories SET is_active = FALSE, deleted_at = NOW() WHERE category_id = $1`,
        [catId]
      );
      logger.info(`Admin soft deleted category #${catId}`);
      res.json({ success: true, message: 'Đã xóa mềm danh mục!' });
    } catch (err) {
      logger.error('Error soft deleting category:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Khôi phục danh mục đã xóa mềm
  static async restoreCategory(req, res) {
    try {
      const catId = parseInt(req.params.id, 10);
      if (!catId) return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ.' });

      await query(
        `UPDATE equipment_categories SET is_active = TRUE, deleted_at = NULL WHERE category_id = $1`,
        [catId]
      );
      logger.info(`Admin restored category #${catId}`);
      res.json({ success: true, message: 'Đã khôi phục danh mục thành công!' });
    } catch (err) {
      logger.error('Error restoring category:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // 3. QUẢN LÝ ĐƠN THUÊ (RENTAL ORDERS CRUD)
  // ==========================================

  static async getAllOrders(req, res) {
    try {
      const { status } = req.query;
      let filter = '';
      const params = [];
      if (status) {
        filter = 'WHERE ro.rental_order_status = $1';
        params.push(status);
      }

      const sql = `
        SELECT 
          ro.rental_order_id AS id,
          ro.order_code,
          ro.customer_id,
          c.full_name AS customer_name,
          c.phone_number,
          c.email,
          ro.rental_start_date,
          ro.expected_return_date,
          ro.rental_order_status,
          ro.subtotal_amount,
          ro.deposit_amount,
          ro.total_amount,
          ro.payment_status,
          ro.shipping_address,
          ro.shipping_name,
          ro.shipping_phone,
          ro.create_date,
          COALESCE(
            json_agg(
              json_build_object(
                'detail_id', rod.rental_order_detail_id,
                'device_name', d.device_name,
                'quantity', rod.rental_quantity,
                'unit_price', rod.unit_rental_price,
                'days', rod.rental_days
              )
            ) FILTER (WHERE rod.rental_order_detail_id IS NOT NULL),
            '[]'
          ) AS items
        FROM rental_orders ro
        LEFT JOIN customers c ON ro.customer_id = c.customer_id
        LEFT JOIN rental_order_details rod ON ro.rental_order_id = rod.rental_order_id
        LEFT JOIN device_variants dv ON rod.variant_id = dv.variant_id
        LEFT JOIN devices d ON dv.device_id = d.device_id
        ${filter}
        GROUP BY ro.rental_order_id, ro.order_code, ro.customer_id, c.full_name, c.phone_number, c.email, ro.create_date
        ORDER BY ro.rental_order_id DESC
      `;
      const orders = await query(sql, params);
      res.json({ success: true, orders });
    } catch (err) {
      logger.error('Error fetching admin orders:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateOrderStatus(req, res) {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { status } = req.body;

      const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ.' });
      }

      await query(
        `UPDATE rental_orders SET rental_order_status = $1 WHERE rental_order_id = $2`,
        [status, orderId]
      );

      logger.info(`Admin updated order #${orderId} status to ${status}`);
      res.json({ success: true, message: `Đã cập nhật trạng thái đơn hàng thành: ${status}` });
    } catch (err) {
      logger.error('Error updating order status:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // 4. QUẢN LÝ KHÁCH HÀNG (CUSTOMERS CRUD)
  // ==========================================

  static async getCustomers(req, res) {
    try {
      const sql = `
        SELECT 
          c.customer_id AS id,
          c.full_name,
          c.phone_number,
          c.email,
          c.address,
          c.identity_number,
          c.status,
          c.created_at,
          COUNT(ro.rental_order_id) AS total_orders
        FROM customers c
        LEFT JOIN rental_orders ro ON c.customer_id = ro.customer_id
        GROUP BY c.customer_id, c.full_name, c.phone_number, c.email, c.address, c.identity_number, c.status, c.created_at
        ORDER BY c.customer_id DESC
      `;
      const customers = await query(sql);
      res.json({ success: true, customers });
    } catch (err) {
      logger.error('Error fetching customers:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateCustomer(req, res) {
    try {
      const customerId = parseInt(req.params.id, 10);
      const { full_name, phone_number, email, address, identity_number } = req.body;

      await query(
        `UPDATE customers 
         SET full_name = COALESCE($1, full_name),
             phone_number = COALESCE($2, phone_number),
             email = COALESCE($3, email),
             address = COALESCE($4, address),
             identity_number = COALESCE($5, identity_number)
         WHERE customer_id = $6`,
        [full_name, phone_number, email, address, identity_number, customerId]
      );

      res.json({ success: true, message: 'Cập nhật thông tin khách hàng thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async softDeleteCustomer(req, res) {
    try {
      const customerId = parseInt(req.params.id, 10);
      await query(
        `UPDATE customers SET status = 'deleted' WHERE customer_id = $1`,
        [customerId]
      );
      logger.info(`Admin soft-deleted customer #${customerId}`);
      res.json({ success: true, message: 'Đã xóa mềm tài khoản khách hàng!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async restoreCustomer(req, res) {
    try {
      const customerId = parseInt(req.params.id, 10);
      await query(
        `UPDATE customers SET status = 'active' WHERE customer_id = $1`,
        [customerId]
      );
      logger.info(`Admin restored customer #${customerId}`);
      res.json({ success: true, message: 'Đã khôi phục tài khoản khách hàng!' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // 5. QUẢN LÝ GIAO DỊCH & VÍ (PAYMENTS & DEPOSITS)
  // ==========================================

  static async getPayments(req, res) {
    try {
      const sql = `
        SELECT 
          p.payment_id AS id,
          p.rental_order_id,
          ro.order_code,
          c.full_name AS customer_name,
          p.amount,
          p.payment_method,
          p.payment_type,
          p.payment_status,
          p.transaction_code,
          p.paid_at,
          p.note
        FROM payments p
        LEFT JOIN rental_orders ro ON p.rental_order_id = ro.rental_order_id
        LEFT JOIN customers c ON ro.customer_id = c.customer_id
        ORDER BY p.payment_id DESC
      `;
      const payments = await query(sql);
      res.json({ success: true, payments });
    } catch (err) {
      logger.error('Error fetching payments:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async processPayment(req, res) {
    try {
      const paymentId = parseInt(req.params.id, 10);
      const { status } = req.body;

      await query(
        `UPDATE payments SET payment_status = $1, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END WHERE payment_id = $2`,
        [status, paymentId]
      );

      res.json({ success: true, message: `Đã xử lý giao dịch: ${status}` });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

}

module.exports = AdminController;
