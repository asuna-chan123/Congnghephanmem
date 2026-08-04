const ReviewModel = require('../models/review.model');
const jwt = require('jsonwebtoken');

function getCustomerIdFromReq(req) {
  let customerId = req.headers['x-customer-id'] ? parseInt(req.headers['x-customer-id'], 10) : null;
  if (!customerId && req.user && req.user.id) {
    customerId = parseInt(req.user.id, 10);
  }
  if (!customerId && req.headers['authorization']) {
    try {
      const token = req.headers['authorization'].replace(/^Bearer\s+/i, '');
      const decoded = jwt.decode(token) || (process.env.JWT_ACCESS_SECRET ? jwt.verify(token, process.env.JWT_ACCESS_SECRET) : null);
      if (decoded && decoded.id) {
        customerId = parseInt(decoded.id, 10);
      }
    } catch (e) {
      console.error('Error parsing customer token in ReviewController:', e.message);
    }
  }
  return customerId;
}

class ReviewController {
  static async getReviewsAndQA(req, res) {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (!productId) {
        return res.status(400).json({ success: false, message: 'Invalid Product ID' });
      }

      const currentCustomerId = getCustomerIdFromReq(req);
      const data = await ReviewModel.getReviewsAndQA(productId, currentCustomerId);
      res.json({ success: true, ...data });
    } catch (error) {
      console.error('Error in getReviewsAndQA:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async checkEligibility(req, res) {
    try {
      const productId = parseInt(req.params.productId, 10);
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        return res.json({ success: true, eligible: false, message: 'Vui lòng đăng nhập.' });
      }

      const eligible = await ReviewModel.hasPurchasedProduct(customerId, productId);
      res.json({ success: true, eligible });
    } catch (error) {
      console.error('Error in checkEligibility:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async addReview(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đánh giá.' });
      }

      const productId = parseInt(req.params.productId, 10);
      const { rating, comment } = req.body;
      if (!rating || !comment) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin đánh giá và số sao.' });
      }

      await ReviewModel.addReviewOrQA(customerId, productId, parseInt(rating, 10), comment);
      res.json({ success: true, message: 'Cảm ơn bạn đã gửi đánh giá!' });
    } catch (error) {
      console.error('Error in addReview:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  static async addQA(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đặt câu hỏi.' });
      }

      const productId = parseInt(req.params.productId, 10);
      const { comment } = req.body;
      if (!comment) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung câu hỏi.' });
      }

      await ReviewModel.addReviewOrQA(customerId, productId, null, comment);
      res.json({ success: true, message: 'Câu hỏi của bạn đã được gửi thành công!' });
    } catch (error) {
      console.error('Error in addQA:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  static async addReply(req, res) {
    try {
      const customerId = getCustomerIdFromReq(req);
      const staffId = req.headers['x-staff-id'] ? parseInt(req.headers['x-staff-id'], 10) : null;
      if (!customerId && !staffId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để phản hồi.' });
      }

      const reviewId = parseInt(req.params.reviewId, 10);
      const { comment } = req.body;
      if (!comment) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung phản hồi.' });
      }

      await ReviewModel.addReply(reviewId, customerId, staffId, comment);
      res.json({ success: true, message: 'Phản hồi đã được gửi.' });
    } catch (error) {
      console.error('Error in addReply:', error);
      res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
  }
}

module.exports = ReviewController;
