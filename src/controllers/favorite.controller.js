const FavoriteModel = require('../models/favorite.model');

class FavoriteController {
  static async getFavorites(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
      }

      const favorites = await FavoriteModel.getFavoritesBySessionId(sessionId);
      res.json({ success: true, products: favorites });
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async toggleFavorite(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      const { productId, variantId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
      }
      if (!productId && !variantId) {
        return res.status(400).json({ success: false, message: 'Product ID or Variant ID is required' });
      }

      const result = await FavoriteModel.toggleFavorite(sessionId, productId, variantId);
      res.json({ success: true, favorited: result.favorited });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  static async checkFavorite(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      const productId = parseInt(req.params.productId);

      if (!sessionId || isNaN(productId)) {
        return res.json({ success: true, favorited: false });
      }

      const favorited = await FavoriteModel.isProductFavorited(sessionId, productId);
      res.json({ success: true, favorited });
    } catch (error) {
      console.error('Error checking favorite:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}

module.exports = FavoriteController;
