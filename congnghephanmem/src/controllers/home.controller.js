const ProductModel = require('../models/product.model');

class HomeController {
  static async getHomeData(req, res) {
    try {
      const categories = await ProductModel.getAllCategories();
      
      // Fetch products for each category
      const categoriesWithProducts = [];
      for (const cat of categories) {
        const products = await ProductModel.getProductsByCategory(cat.id);
        categoriesWithProducts.push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          products
        });
      }

      // Fetch combos
      const combos = await ProductModel.getAllCombos();

      // Fetch try before buy products
      const tryBeforeBuy = await ProductModel.getTryBeforeBuyProducts();

      res.json({
        success: true,
        categories: categoriesWithProducts,
        combos,
        tryBeforeBuy
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching home page data.',
        error: error.message
      });
    }
  }
}

module.exports = HomeController;
