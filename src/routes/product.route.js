const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');

router.get('/', ProductController.getAllProductsList);
router.get('/:id', ProductController.getProductDetails);
router.post('/:id/rent', ProductController.rentProduct);

module.exports = router;
