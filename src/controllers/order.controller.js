const OrderModel = require('../models/order.model');
const jwt = require('jsonwebtoken');

function getCustomerIdFromReq(req) {
  let customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
  if (!customerId && req.headers['authorization']) {
    try {
      const token = req.headers['authorization'].replace(/^Bearer\s+/i, '');
      const decoded = jwt.decode(token) || (process.env.JWT_SECRET ? jwt.verify(token, process.env.JWT_SECRET) : null);
      if (decoded && decoded.id) {
        customerId = parseInt(decoded.id, 10);
      }
    } catch (e) {
      console.error('Error parsing customer token:', e.message);
    }
  }
  return customerId;
}

class OrderController {
  static async getOrders(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        // Kiểm tra đăng nhập
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem đơn hàng.' });
      }
      //Gọi đến model để lấy dữ liệu
      const orders = await OrderModel.getOrdersByCustomerId(customerId);
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async cancelOrder(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
      }

      const orderId = parseInt(req.params.id, 10);
      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ.' });
      }
      //Truyền dữ liệu đến model để xử lý 
      await OrderModel.cancelOrder(customerId, orderId);
      res.json({ success: true, message: 'Đơn hàng đã được hủy thành công.' });
    }
    //Nhận phản hồi từ model
    catch (error) {
      console.error('Error cancelling order:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  static async updateShipping(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
      }

      const orderId = parseInt(req.params.id, 10);
      // Chỉ lấy shippingName và shippingPhone
      const { shippingName, shippingPhone } = req.body;

      if (!shippingName || !shippingPhone) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên và SĐT.' });
      }

      // Truyền null hoặc chuỗi rỗng vào vị trí của shippingAddress để tương thích với Model cũ
      await OrderModel.updateShippingInfo(customerId, orderId, shippingName, shippingPhone, null);
      res.json({ success: true, message: 'Cập nhật thông tin giao hàng thành công.' });
    } catch (error) {
      console.error('Error updating shipping info:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  static async extendOrder(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
      }

      const orderId = parseInt(req.params.id, 10);
      const { newReturnDate } = req.body;

      if (!newReturnDate) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày gia hạn mới.' });
      }

      await OrderModel.extendOrder(customerId, orderId, newReturnDate);
      res.json({ success: true, message: 'Gia hạn đơn hàng thành công.' });
    } catch (error) {
      console.error('Error extending order:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  static async getExtendCost(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
      }

      const orderId = parseInt(req.params.id, 10);
      const { newReturnDate } = req.query;

      if (!newReturnDate) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày gia hạn mới.' });
      }

      const data = await OrderModel.calculateExtendCost(customerId, orderId, newReturnDate);
      res.json({ success: true, ...data });
    } catch (error) {
      console.error('Error calculating extension cost:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  static async returnOrder(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
      }

      const orderId = parseInt(req.params.id, 10);
      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ.' });
      }

      await OrderModel.returnOrder(customerId, orderId);
      res.json({ success: true, message: 'Yêu cầu trả hàng đã được gửi thành công.' });
    } catch (error) {
      console.error('Error returning order:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  static async reportIssue(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
      }

      const orderId = parseInt(req.params.id, 10);
      const { note } = req.body;

      if (!note || !note.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung mô tả lỗi.' });
      }

      await OrderModel.reportIssue(customerId, orderId, note.trim());
      res.json({
        success: true,
        message: 'Yêu cầu hỗ trợ kỹ thuật của bạn đã được ghi nhận. Tổng đài viên sẽ gọi hỗ trợ trong vòng 15 phút.'
      });
    } catch (error) {
      console.error('Error reporting issue:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }
}

module.exports = OrderController;
