const CartModel = require('../models/cart.model');
const OrderModel = require('../models/order.model');
const { get } = require('../models/db');

//get cart
class CartController {
  static async getCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      if (!sessionId && !customerId) {
        return res.status(400).json({ success: false, message: 'Session ID or Customer ID is required' });
      }

      const cartItems = await CartModel.getCartBySessionId(sessionId, customerId);

      let total = 0;
      cartItems.forEach(item => {
        total += (item.price * item.quantity);
      });

      res.json({ success: true, cart: cartItems, total });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async addToCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      if (!sessionId && !customerId) {
        return res.status(400).json({ success: false, message: 'Session ID or Customer ID is required' });
      }

      const { productId, quantity, variantId, rentalStartDate, rentalEndDate } = req.body;
      if (!productId && !variantId) {
        return res.status(400).json({ success: false, message: 'Product ID or Variant ID is required' });
      }

      const qty = parseInt(quantity, 10) || 1;

      await CartModel.addItem(sessionId, customerId, productId || null, qty, variantId || null, rentalStartDate || null, rentalEndDate || null);
      res.json({ success: true, message: 'Added to cart' });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  static async removeFromCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      const cartItemId = req.params.id;

      if (!sessionId && !customerId) {
        return res.status(400).json({ success: false, message: 'Session ID or Customer ID is required' });
      }

      await CartModel.removeItem(sessionId, customerId, cartItemId);
      res.json({ success: true, message: 'Removed from cart' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  static async clearCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      if (!sessionId && !customerId) {
        return res.status(400).json({ success: false, message: 'Session ID or Customer ID is required' });
      }

      await CartModel.clearCart(sessionId, customerId);
      res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async updateQuantity(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      const cartItemId = req.params.id;
      const { quantity } = req.body;

      if (!sessionId && !customerId) {
        return res.status(400).json({ success: false, message: 'Session ID or Customer ID is required' });
      }

      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty < 1) {
        return res.status(400).json({ success: false, message: 'Invalid quantity' });
      }

      await CartModel.updateQuantity(sessionId, customerId, cartItemId, qty);
      res.json({ success: true, message: 'Quantity updated' });
    } catch (error) {
      console.error('Error updating quantity:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async checkout(req, res) {
    try {
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập trước khi thanh toán.' });
      }

      const { selectedItemIds } = req.body;
      if (!selectedItemIds || selectedItemIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.' });
      }

      // Kiểm tra xác minh danh tính CCCD của khách hàng trước khi cho phép thanh toán
      const customer = await get(
        'SELECT identity_number, identity_image_front, identity_image_back FROM customers WHERE customer_id = ?',
        [customerId]
      );

      const hasCCCD = (customer?.identity_number && customer.identity_number.trim().length > 0) ||
                      (customer?.identity_image_front && customer.identity_image_front.trim().length > 0) ||
                      (customer?.identity_image_back && customer.identity_image_back.trim().length > 0);

      if (!hasCCCD) {
        return res.status(400).json({
          success: false,
          requireProfileUpdate: true,
          message: 'Tài khoản của bạn chưa cập nhật Căn cước công dân (CCCD). Vui lòng cập nhật hồ sơ trước khi thanh toán.'
        });
      }

      const result = await OrderModel.createOrderFromCart(customerId, selectedItemIds);
      res.json({ success: true, message: 'Thanh toán thành công. Đơn hàng đã được khởi tạo.', order: result });
    } catch (error) {
      console.error('Error during checkout:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }
}

module.exports = CartController;
