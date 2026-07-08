const OrderModel = require('../models/order.model');

class OrderController {
  static async getOrders(req, res) {
    try {
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem đơn hàng.' });
      }

      const orders = await OrderModel.getOrdersByCustomerId(customerId);
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async cancelOrder(req, res) {
    try {
      const customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
      }

      const orderId = parseInt(req.params.id, 10);
      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ.' });
      }

      await OrderModel.cancelOrder(customerId, orderId);
      res.json({ success: true, message: 'Đơn hàng đã được hủy thành công.' });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }
}

module.exports = OrderController;
