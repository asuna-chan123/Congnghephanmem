const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cart.controller');

const { verifyToken } = require('../Customer/util');

router.get('/', CartController.getCart);
router.post('/add', CartController.addToCart);
router.put('/:id', CartController.updateQuantity);
router.delete('/:id', CartController.removeFromCart);
router.delete('/', CartController.clearCart);
router.post('/checkout', verifyToken, CartController.checkout);

module.exports = router;
