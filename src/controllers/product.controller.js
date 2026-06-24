const ProductModel = require('../models/product.model');
const ReviewModel = require('../models/review.model');

class ProductController {
  static async getAllProductsList(req, res) {
    try {
      const products = await ProductModel.getAllProducts();
      const categories = await ProductModel.getAllCategories();
      res.json({
        success: true,
        products,
        categories
      });
    } catch (error) {
      console.error('Error fetching all products list:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching products list.',
        error: error.message
      });
    }
  }

  static async getProductDetails(req, res) {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
      }

      const product = await ProductModel.getProductById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      // Fetch reviews
      const reviews = await ReviewModel.getReviewsByProduct(productId);

      // Fetch related products
      const related = await ProductModel.getRelatedProducts(product.category_id, product.id);

      // Fetch rentals (blocked dates)
      const rentals = await ProductModel.getProductRentals(productId);

      res.json({
        success: true,
        product,
        reviews,
        related,
        rentals
      });
    } catch (error) {
      console.error('Error fetching product details:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching product details.',
        error: error.message
      });
    }
  }

  static async rentProduct(req, res) {
    try {
      const productId = parseInt(req.params.id);
      const { startDate, endDate } = req.body;

      if (isNaN(productId) || !startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Invalid parameters.' });
      }

      // Quick validation: Check if dates overlap with existing bookings
      const rentals = await ProductModel.getProductRentals(productId);
      const isOverlap = rentals.some(r => {
        return (startDate <= r.end_date && endDate >= r.start_date);
      });

      if (isOverlap) {
        return res.status(400).json({
          success: false,
          message: 'Những ngày này đã được người khác thuê trước đó. Vui lòng chọn khoảng thời gian khác.'
        });
      }

      await ProductModel.addRental(productId, startDate, endDate);
      res.json({
        success: true,
        message: 'Đăng ký thuê thiết bị thành công!'
      });
    } catch (error) {
      console.error('Error booking rental:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while reserving rental.',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;
