const express = require('express'); //[cite: 7, 12]
const router = express.Router(); //[cite: 7, 12]
const authController = require('./controller'); //[cite: 7]
const { verifyAction } = require('./util'); //[cite: 7]

// Tuyến đường đăng ký[cite: 12]
router.post('/register', authController.register); //[cite: 12]

// Các tuyến đường đăng nhập và cấp lại token[cite: 7]
router.post('/customer/login', authController.customerLogin); //[cite: 7]
router.post('/staff/login', authController.staffLogin); //[cite: 7]
router.post('/re-auth', authController.reAuth); //[cite: 7]

// Route test[cite: 7]
router.get('/test-action', verifyAction, (req, res) => { //[cite: 7]
    res.status(200).json({ message: "Cho phép thao tác!", user: req.user }); //[cite: 7]
}); //[cite: 7]

module.exports = router; //[cite: 7, 12]