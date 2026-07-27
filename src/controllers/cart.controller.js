const CartModel = require('../models/cart.model');
const OrderModel = require('../models/order.model');
const walletService = require('../Payment/service');

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

      let totalRent = 0;
      let totalDeposit = 0;

      cartItems.forEach(item => {
        totalRent += (item.price * item.rentalDays * item.quantity);
        totalDeposit += (item.deposit * item.quantity);
      });

      const total = totalRent + totalDeposit;

      res.json({ success: true, cart: cartItems, total, totalRent, totalDeposit });
    } 
    catch (error) {
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

      //change quantity
      await CartModel.updateQuantity(sessionId, customerId, cartItemId, requestedQty);
      res.json({ success: true, message: 'Quantity updated' });
    } catch (error) {
      console.error('Error updating quantity:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

static async checkout(req, res) {
    try {
      // Ưu tiên lấy customerId từ token (req.user.id) nếu bạn dùng middleware verifyToken, 
      // hoặc fallback về header cũ.
      const customerId = req.user?.id || (req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null);
      
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập trước khi thanh toán.' });
      }

      // Nhận toàn bộ payload từ Frontend gửi lên
      const { selectedItemIds, paymentMethod, shippingDetails, totalAmount } = req.body;

      // XỬ LÝ THANH TOÁN BẰNG VÍ E-TECH
      if (paymentMethod === 'wallet') {
          if (!totalAmount || totalAmount <= 0) {
              return res.status(400).json({ success: false, message: 'Số tiền thanh toán không hợp lệ.' });
          }
          try {
              // Gọi hàm Rút tiền/Trừ tiền cọc. Nếu số dư không đủ, nó sẽ tự văng lỗi (throw Error)
              await walletService.createWithdrawal(customerId, totalAmount);
          } catch (walletError) {
              return res.status(400).json({ success: false, message: walletError.message || "Số dư ví không đủ để đặt cọc." });
          }
      }

      // TẠO ĐƠN HÀNG
      // Lưu ý: Cần đảm bảo OrderModel.createOrderFromCart của bạn đã sẵn sàng nhận thêm paymentMethod và shippingDetails
      const result = await OrderModel.createOrderFromCart(customerId, selectedItemIds, paymentMethod, shippingDetails);
      
      res.json({ success: true, message: 'Thanh toán thành công. Đơn hàng đã được khởi tạo.', order: result });
    } catch (error) {
      console.error('Error during checkout:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }
}

module.exports = CartController;
