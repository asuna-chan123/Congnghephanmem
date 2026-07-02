const ProductModel = require('./src/models/product.model');

async function test() {
  try {
    console.log('Testing getAllCategories...');
    const categories = await ProductModel.getAllCategories();
    console.log('Categories:', categories);

    for (const cat of categories) {
      console.log(`Testing getProductsByCategory for category ID ${cat.id}...`);
      const products = await ProductModel.getProductsByCategory(cat.id);
      console.log(`Products for category ID ${cat.id}:`, products.length);
    }

    console.log('Testing getTryBeforeBuyProducts...');
    const tryBeforeBuy = await ProductModel.getTryBeforeBuyProducts();
    console.log('TryBeforeBuy:', tryBeforeBuy.length);

    console.log('All queries passed successfully!');
  } catch (error) {
    console.error('Error during query execution:', error);
  }
}

test();
