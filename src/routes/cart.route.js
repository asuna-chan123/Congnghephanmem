const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cart.controller');

router.get('/', CartController.getCart);
router.post('/add', CartController.addToCart);
router.put('/:id', CartController.updateQuantity);
router.delete('/:id', CartController.removeFromCart);
router.delete('/', CartController.clearCart);

module.exports = router;
