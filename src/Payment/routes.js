const express = require('express');
const router = express.Router();
const controller = require('./controller');

// MƯỢN MIDDLEWARE XÁC THỰC TỪ MODULE CUSTOMER
// (Giả định file util.js của bạn nằm trong thư mục Customer)
const { verifyToken } = require('../Customer/util');

// Gắn verifyToken vào làm "bảo vệ" cho các tuyến đường liên quan đến ví cá nhân
router.post('/deposit', verifyToken, controller.createDeposit);
router.post('/withdraw', verifyToken, controller.createWithdrawal);
router.get('/history', verifyToken, controller.getTransactionHistory); 
router.get('/info', verifyToken, controller.getWalletInfo);

// Các API cho Admin hoặc hệ thống duyệt (không cần verifyToken của customer hoặc cần quyền Admin riêng)
router.post('/process', controller.processTransaction);
router.get('/status/:id', controller.getTransactionStatus);
router.get('/pending', controller.getPendingTransactions);

module.exports = router;