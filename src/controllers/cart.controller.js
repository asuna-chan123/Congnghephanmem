const CartModel = require('../models/cart.model');

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

      const { productId, quantity, variantId } = req.body;
      if (!productId && !variantId) {
        return res.status(400).json({ success: false, message: 'Product ID or Variant ID is required' });
      }

      const qty = parseInt(quantity, 10) || 1;

      await CartModel.addItem(sessionId, customerId, productId || null, qty, variantId || null);
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
      res.json({ success: true, message: 'Item removed' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
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

      const cartItem = await CartModel.getCartItem(sessionId, customerId, cartItemId);
      if (!cartItem) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
      }

      const requestedQty = parseInt(quantity, 10) || 1;
      const stock = await CartModel.checkVariantStock(cartItem.variant_id);

      if (requestedQty > stock) {
        return res.status(400).json({
          success: false,
          message: `Rất tiếc, kho hàng chỉ còn lại ${stock} sản phẩm này.`
        });
      }

      await CartModel.updateQuantity(sessionId, customerId, cartItemId, requestedQty);
      res.json({ success: true, message: 'Quantity updated' });
    } catch (error) {
      console.error('Error updating quantity:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}

module.exports = CartController;
