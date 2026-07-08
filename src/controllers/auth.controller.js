const { query, get } = require('../models/db');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
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
}

module.exports = AuthController;
