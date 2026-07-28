const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');

router.get('/', OrderController.getOrders);
router.post('/:id/cancel', OrderController.cancelOrder);
router.put('/:id/shipping', OrderController.updateShipping);
router.get('/:id/extend-cost', OrderController.getExtendCost);
router.post('/:id/extend', OrderController.extendOrder);
router.post('/:id/return', OrderController.returnOrder);
router.post('/:id/report-issue', OrderController.reportIssue);

module.exports = router;
