const CartModel = require('../models/cart.model');

class CartController {
  static async getCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
      }

      const cartItems = await CartModel.getCartBySessionId(sessionId);
      
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
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
      }

      const { productId, comboId, type, quantity, variantId } = req.body;
      if (!productId && !comboId && !variantId) {
        return res.status(400).json({ success: false, message: 'Product ID, Variant ID or Combo ID is required' });
      }
      if (!type) {
        return res.status(400).json({ success: false, message: 'Type is required' });
      }

      const qty = parseInt(quantity, 10) || 1;

      await CartModel.addItem(sessionId, productId || null, comboId || null, type, qty, variantId || null);
      res.json({ success: true, message: 'Added to cart' });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async removeFromCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      const cartItemId = req.params.id;
      
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
      }

      await CartModel.removeItem(sessionId, cartItemId);
      res.json({ success: true, message: 'Item removed' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async clearCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
      }

      await CartModel.clearCart(sessionId);
      res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async updateQuantity(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      const cartItemId = req.params.id;
      const { quantity } = req.body;

      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
      }

      await CartModel.updateQuantity(sessionId, cartItemId, parseInt(quantity, 10) || 1);
      res.json({ success: true, message: 'Quantity updated' });
    } catch (error) {
      console.error('Error updating quantity:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}

module.exports = CartController;
