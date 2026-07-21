const { query, get } = require('../models/db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function saveBase64Image(base64Str, prefix, customerId) {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return base64Str;
  }
  
  try {
    const parts = base64Str.split(';base64,');
    if (parts.length !== 2) {
      throw new Error('Định dạng ảnh không hợp lệ.');
    }
    
    const mime = parts[0];
    const data = parts[1];
    const buffer = Buffer.from(data, 'base64');
    
    let ext = mime.replace('data:image/', '');
    if (ext === 'jpeg') ext = 'jpg';
    
    // Clean up extensions like svg+xml or similar if necessary, or default to jpg
    ext = ext.split('+')[0]; // handling e.g. svg+xml
    if (!/^[a-zA-Z0-9]+$/.test(ext)) {
      ext = 'jpg';
    }

    const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `${prefix}_${customerId}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);
    
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving base64 image:', err);
    throw new Error('Không thể lưu trữ ảnh tải lên.');
  }
}


async function mergeGuestData(sessionId, customerId) {
  if (!sessionId || !customerId) return;
  try {
    // 1. Merge Cart Items
    const guestCartItems = await query(
      'SELECT cart_item_id, variant_id, quantity FROM cart_items WHERE session_id = ? AND customer_id IS NULL',
      [sessionId]
    );

    for (const item of guestCartItems) {
      const existing = await get(
        'SELECT cart_item_id, quantity FROM cart_items WHERE customer_id = ? AND variant_id = ?',
        [customerId, item.variant_id]
      );

      if (existing) {
        // Sum quantities and delete guest item
        await query(
          'UPDATE cart_items SET quantity = quantity + ? WHERE cart_item_id = ?',
          [item.quantity, existing.cart_item_id]
        );
        await query('DELETE FROM cart_items WHERE cart_item_id = ?', [item.cart_item_id]);
      } else {
        // Link to customer
        await query(
          'UPDATE cart_items SET customer_id = ? WHERE cart_item_id = ?',
          [customerId, item.cart_item_id]
        );
      }
    }

    // 2. Merge Favorites
    const guestFavorites = await query(
      'SELECT favorite_id, variant_id FROM favorites WHERE session_id = ? AND customer_id IS NULL',
      [sessionId]
    );

    for (const fav of guestFavorites) {
      const existing = await get(
        'SELECT favorite_id FROM favorites WHERE customer_id = ? AND variant_id = ?',
        [customerId, fav.variant_id]
      );

      if (existing) {
        // Delete duplicate guest favorite
        await query('DELETE FROM favorites WHERE favorite_id = ?', [fav.favorite_id]);
      } else {
        // Link to customer
        await query(
          'UPDATE favorites SET customer_id = ? WHERE favorite_id = ?',
          [customerId, fav.favorite_id]
        );
      }
    }
  } catch (error) {
    console.error('Error merging guest data:', error);
  }
}

class AuthController {
  static async register(req, res) {
    try {
      const { email, password, fullName, phoneNumber, address } = req.body;
      const sessionId = req.headers['x-session-id'];

      if (!email || !password || !fullName) {
        return res.status(400).json({ success: false, message: 'Email, mật khẩu và họ tên là bắt buộc.' });
      }

      // Check if user exists
      const existingUser = await get('SELECT customer_id FROM customers WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });
      }

      const passwordHash = hashPassword(password);

      // Insert new customer
      const result = await query(
        `INSERT INTO customers (full_name, phone_number, email, address, password_hash) 
         VALUES (?, ?, ?, ?, ?) RETURNING customer_id, full_name, email`,
        [fullName, phoneNumber || null, email, address || null, passwordHash]
      );

      const newUser = result[0];

      // Merge guest cart/favorites to this new user account
      if (sessionId) {
        await mergeGuestData(sessionId, newUser.customer_id);
      }

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công.',
        user: {
          id: newUser.customer_id,
          fullName: newUser.full_name,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ trong quá trình đăng ký.' });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const sessionId = req.headers['x-session-id'];

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc.' });
      }

      const user = await get('SELECT customer_id, full_name, email, password_hash FROM customers WHERE email = ?', [email]);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
      }

      const passwordHash = hashPassword(password);
      if (user.password_hash !== passwordHash) {
        return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
      }

      // Merge guest cart/favorites to this user account
      if (sessionId) {
        await mergeGuestData(sessionId, user.customer_id);
      }

      res.json({
        success: true,
        message: 'Đăng nhập thành công.',
        user: {
          id: user.customer_id,
          fullName: user.full_name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ trong quá trình đăng nhập.' });
    }
  }

  static async getProfile(req, res) {
    try {
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập.' });
      }

      const user = await get(
        `SELECT customer_id, full_name, phone_number, email, address, identity_number, 
                identity_image_front, identity_image_back, bank_name, bank_account_number 
         FROM customers WHERE customer_id = ?`,
        [customerId]
      );

      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản.' });
      }

      res.json({
        success: true,
        user: {
          id: user.customer_id,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          email: user.email,
          address: user.address,
          identityNumber: user.identity_number,
          identityImageFront: user.identity_image_front,
          identityImageBack: user.identity_image_back,
          bankName: user.bank_name,
          bankAccountNumber: user.bank_account_number
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy thông tin hồ sơ.' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập.' });
      }

      const {
        fullName,
        phoneNumber,
        address,
        identityNumber,
        identityImageFront,
        identityImageBack,
        bankName,
        bankAccountNumber
      } = req.body;

      if (!fullName) {
        return res.status(400).json({ success: false, message: 'Họ tên không được để trống.' });
      }

      let frontImgPath = identityImageFront;
      let backImgPath = identityImageBack;

      if (identityImageFront && identityImageFront.startsWith('data:image/')) {
        frontImgPath = saveBase64Image(identityImageFront, 'cccd_front', customerId);
      }
      if (identityImageBack && identityImageBack.startsWith('data:image/')) {
        backImgPath = saveBase64Image(identityImageBack, 'cccd_back', customerId);
      }

      await query(
        `UPDATE customers 
         SET full_name = ?, phone_number = ?, address = ?, identity_number = ?, 
             identity_image_front = ?, identity_image_back = ?, bank_name = ?, bank_account_number = ?
         WHERE customer_id = ?`,
        [
          fullName,
          phoneNumber || null,
          address || null,
          identityNumber || null,
          frontImgPath || null,
          backImgPath || null,
          bankName || null,
          bankAccountNumber || null,
          customerId
        ]
      );

      res.json({
        success: true,
        message: 'Cập nhật hồ sơ thành công.',
        user: {
          id: customerId,
          fullName: fullName,
          phoneNumber: phoneNumber,
          address: address,
          identityNumber: identityNumber,
          identityImageFront: frontImgPath,
          identityImageBack: backImgPath,
          bankName: bankName,
          bankAccountNumber: bankAccountNumber
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật hồ sơ.' });
    }
  }

  static async verifyPassword(req, res) {
    try {
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập.' });
      }

      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, message: 'Mật khẩu là bắt buộc.' });
      }

      const user = await get('SELECT password_hash FROM customers WHERE customer_id = ?', [customerId]);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
      }

      const passwordHash = hashPassword(password);
      if (user.password_hash !== passwordHash) {
        return res.status(400).json({ success: false, message: 'Mật khẩu không chính xác.' });
      }

      res.json({ success: true, message: 'Xác minh mật khẩu thành công.' });
    } catch (error) {
      console.error('Verify password error:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xác minh mật khẩu.' });
    }
  }
}

module.exports = AuthController;
