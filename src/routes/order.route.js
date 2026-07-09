const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');

router.get('/', OrderController.getOrders);
router.post('/:id/cancel', OrderController.cancelOrder);
router.put('/:id/shipping', OrderController.updateShipping);
router.post('/:id/extend', OrderController.extendOrder);
router.post('/:id/return', OrderController.returnOrder);

module.exports = router;
